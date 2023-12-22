"""
This file demonstrates the use of linear optimazation techniques by facilitating IBM CPLEX.
In this example the goal is to minimize the total system cost for energy flows between consumers and generators. The
assumptions are:

- generators need to sell their energy surplus
- consumers need to buy energy to cover their demand
- each transaction (energy flow from generator to consumer) has a cost which is determined by the amount of energy
multiplied with a cost factor (e. g. distance between generator and consumer)

CPLEX is used to find the optimal transactions (lowest overall cost) for the whole system at each timestep t
https://www.ibm.com/support/knowledgecenter/en/SSSA5P_12.8.0/ilog.odms.cplex.help/CPLEX/GettingStarted/topics/set_up
/Python_setup.html
IBM ILOG CPLEX Optimization Studio must be installed and the PYTHONPATH environment variable must be set to
"yourCPLEXhome/python/VERSION/PLATFORM"

required packages:
- pandas
- numpy
- cplex (https://pypi.org/project/cplex/)
- docplex (https://pypi.org/project/docplex/)

tested with Python 3.7
"""

import numpy as np
import json
from pandas import DataFrame, merge
from docplex.mp.model import Model
from sys import stdout


# region class definition Timestep
class Timestep:
    def __init__(self, t_, gen_, con_, cost_matrix_, external_id_):

        from copy import copy
        minval = copy(min([gen_.min().min(), con_.min().min()]))
        maxval = copy(max([gen_.max().max(), con_.max().max()]))
        _erz = DataFrame(np.interp(gen_.values, (minval, maxval), (0, 1)), index=gen_.index, columns=gen_.columns)
        _ver = DataFrame(np.interp(con_.values, (minval, maxval), (0, 1)), index=con_.index, columns=con_.columns)

        # Daten des Objekts
        self.t = t_  # time step
        self.gen = np.reshape(gen_.values, (gen_.values.shape[0],))  # total generation at time t by distinct generators
        self.con = np.reshape(con_.values, (con_.values.shape[0],))  # total consumption at time t by distinct consumers
        self.costs = cost_matrix_.values  # e. g. distances between every consumer and every generator
        self.ids_gen = np.array(gen_.index)  # id's of generators (same order as in self.gen)
        self.ids_con = np.array(con_.index)  # id's of consumers (same order as in self.con)
        self.external_id = external_id_  # id of external source/sink

        # residual load has to be calculated differently depending on wether external asset is energy sink or source
        self.residual = sum(self.con) - sum(self.gen[:-1]) if self.external_id in self.ids_gen else sum(
            self.con[:-1]) - sum(self.gen)
        self.n_con = len(self.ids_con)
        self.n_gen = len(self.ids_gen)

        self.result = None  # results

    def optimize(self, verbose=True):
        # weighted cost matrix  [c, g] --> cost [c, g] * generated energy amount [g, ]
        #Erzeugte Energiemengen werden mit Distanz multipliziert --> Teuer weiter zu liefern --> Gewichtete Kostenmatrix
        d = np.multiply(self.costs, self.gen)

        # region formalize problem (using docplex package)
        mdl = Model(name=f'ts_{self.t}')

        # decision variables --> Matrix aus Entscheidungsvariablen: Anteil der Energiemenge, die von Erzeuger zu Verbraucher fließt
        # Selbe Shape der Distanzmatrix --> Definition der Entscheidungsvariablen
        z = mdl.continuous_var_matrix(list(range(self.n_con)), list(range(self.n_gen)), lb=0, ub=1,
                                      name='z')

        # formulate constraints (using docplex package)
        # The constraints are formulated depending on wether the residual load is positiv or negativ.
        # This is accomplished by dynamically defining the number of consumers/generators when creating the constraints.
        # consumers: every consumer has to obtain 100% of its demand (except external energy sink)
        # Zwei constraints: SUmme Spalte entspricht Summe Erzeuger, Summe Zeile entspricht Summe Verbrauch eines Verbrauchers
        # docplex function: scal_prod --> notwendig aus Performancegründen
        #if else: Unterscheidung ob source oder dump
        mdl.add_constraints([mdl.scal_prod([z[c, g] for g in range(self.n_gen)],
                                           [self.gen[g] for g in range(self.n_gen)]) == self.con[c] for c in range(
            self.n_con - (0 if self.external_id in self.ids_gen else 1))])
        # generators: every generator has to deliver 100% of its generation (except external energy source)
        #Summe der Entscheidungsvariable z steht für alle consumer + Fallunterscheidung source oder dump
        mdl.add_constraints([mdl.sum_vars([z[c, g] for c in range(self.n_con)]) == 1 for g in
                             range(self.n_gen - (1 if self.external_id in self.ids_gen else 0))])

        # formalize problem
        # sum funktion von cplex verwenden, da effizienter
        # Kostenmatrix mit Entscheidungsvariable multipliziert, davon wird Summe gebildet welche minimal sein soll
        mdl.minimize(mdl.sum(
            [mdl.scal_prod([z[c, g] for g in range(self.n_gen)], [d[c][g] for g in range(self.n_gen)])
             for c in range(self.n_con)]))
        # endregion

        # region solve problem (using cplex package)
        mdl_cplex = mdl.get_cplex()  # convert docplex model object into cplex model object

        # activate logging
        if verbose:
            mdl_cplex.set_results_stream(stdout)
            mdl_cplex.set_warning_stream(stdout)
            mdl_cplex.set_error_stream(stdout)
            mdl_cplex.set_log_stream(stdout)
        print(f'solving t = {self.t}...')

        # solve problem
        mdl_cplex.solve()

        # https://www.ibm.com/support/knowledgecenter/SSSA5P_20.1.0/ilog.odms.cplex.help/CPLEX/UsrMan/topics
        # /discr_optim/mip/troubleshoot/60_infeas_int_var.html
        # "In most cases a solution with status CPX_STAT_OPTIMAL_INFEAS will be satisfactory, and reflects only
        # round-off error after presolve uncrush, but extra care in using the solution may be advisable in
        # numerically sensitive formulations."
        # http://www-eio.upc.es/lceio/manuals/cplex-11/html/refcallablelibrary/html/macros/CPX_STAT_OPTIMAL_INFEAS.html
        # CPX_STAT_OPTIMAL_INFEAS: Optimal solution is available, but with infeasibilities after unscaling
        # -------------------------
        # --> status 5 optimal_infeasible can be treated as solved, if inaccuracies after scaling are acceptable
        # --> status 1 means optimal solution found

        #zuordnung von z auf Verbraucher und entsprechenden IDs
        if mdl_cplex.solution.get_status() in [1, 5]:
            tmp_ergebnis = None
            for var, (idx, val) in zip(mdl_cplex.variables.get_names(), enumerate(mdl_cplex.solution.get_values())):
                if val != 0:
                    _val = round(val, 8)
                    v, e = self.ids_con[int(var.split('_')[-2])], self.ids_gen[int(var.split('_')[-1])]
                    tmp_ergebnis = np.array([v, e, _val]) if tmp_ergebnis is None else np.vstack(
                        [tmp_ergebnis, np.array([v, e, _val])])
            self.result = DataFrame(tmp_ergebnis, columns=['id_con', 'id_gen', 'share_rel'])
            return True
        else:
            return False
        # endregion

    def print_results(self):
        con = DataFrame(self.ids_con, columns=['id_con']).join(DataFrame(self.con, columns=['con'])).set_index('id_con')
        gen = DataFrame(self.ids_gen, columns=['id_gen']).join(DataFrame(self.gen, columns=['gen'])).set_index('id_gen')
        res = merge(left=self.result, right=con, how='inner', on='id_con')  # join consumer data to result
        res = merge(left=res, right=gen, how='inner', on='id_gen')  # join generator data to result
        # analyse results
        # each row in "res" represents a transaction of energy between a consumer and a generator
        # "con" and "gen" describe the total amount of energy consumed/generated by each asset at this timestep
        # "share_rel" describes the percentage of the total amount of energy of a generator that is send to the consumer
        res['share_abs'] = res['share_rel'] * res['gen']  # calculate absolute amount of energy per transaction
        return res


# endregion

def print_info(con, gen):
    print(f'n consumers: {len(con)}')
    print(f'n generators: {len(gen)}')
    print(f'total consumption: {con.sum()}')
    print(f'total generation: {gen.sum()}')


if __name__ == '__main__':
    # region set up CPLEX environment
    # path to cplex-installation must be set in PYTHONPATH environment variable
    # https://www.ibm.com/support/knowledgecenter/en/SSSA5P_12.8.0/ilog.odms.cplex.help/CPLEX/GettingStarted/topics
    # /set_up/Python_setup.html

    # cplex_path = '/opt/ibm/ILOG/CPLEX_Studio129/cplex/python/3.7/x86-64_linux/'
    # if cplex_path not in path:
    #     path.append(cplex_path)

    # endregion

    # region create dummy assets
    # assets used as an umbrella term for consumers and generators
    # column = timestep
    # index = id of asset
    # values = amount of energy consumed (negative) or generated (positive)
    assets = DataFrame(data=[[-1, -1, -1, -1, -1],
                             [0, -1, -2, -1, 0],
                             [0, 0, -2, -2, -2],
                             [-5, -4, -3, -4, -4],
                             [5, 3, -1, -6, 0],
                             [0, 0, 1, 1, 1],
                             [0, 1, 2, 1, 0],
                             [0, 0, 4, 0, 0],
                             [3, 2, 2, 3, 5]],
                       index=list(range(1, 10)))
    # endregion

    # region define cost_matrix
    # initialize with random values as cost
    # cost can be e. g. the distance between assets
    # --> the farther away two assets are from each other the more expansive is the exchange of energy between those two
    cost_matrix = DataFrame(np.random.randint(1, 100, size=(len(assets), len(assets))), columns=assets.index,
                            index=assets.index)
    # add external energy source / dump with significantly higher costs
    # thus, it is only used by the optimizer to account for differences between total consumption and generation
    external_id = -99
    cost_matrix.loc[:, external_id] = 99999
    cost_matrix.loc[external_id] = 99999
    # set distance between identical assets to zero
    np.fill_diagonal(cost_matrix.values, 0)

    # endregion

    # region loop over timesteps
    for t in assets.columns[:5]:

        # identify consumers and generators for timestep t
        generators = assets[t].loc[assets[t] > 0]
        consumers = assets[t].loc[assets[t] < 0].apply(abs)

        print_info(consumers, generators)

        # add external energy source / dump if total residual load != 0
        total_gen, total_con = generators.sum(), consumers.sum()
        if total_gen > total_con:
            consumers[external_id] = total_gen - total_con
            print('added external energy source / dump')
            print_info(consumers, generators)
        elif total_gen < total_con:
            generators.loc[external_id] = total_con - total_gen
            print('added external energy source / dump')
            print_info(consumers, generators)

        # build subset of cost matrix; thus, it contains only values that are relevant for timestep t
        cost_matrix_for_time_t = cost_matrix.filter(items=list(consumers.index), axis=0)
        cost_matrix_for_time_t = cost_matrix_for_time_t.filter(items=list(generators.index), axis=1)

        # create instance of Timestep and call optimize()
        x = Timestep(t_=t, gen_=generators.to_frame(), con_=consumers.to_frame(), cost_matrix_=cost_matrix_for_time_t,
                     external_id_=external_id)
        print('\n')
        if x.optimize(verbose=True):
            print(x.print_results().to_json(f"./result_{t}.json"))
            print(f'\noptimazation for timestep {t} successful!')
        else:
            print(f'\noptimazation for timestep {t} failed!')
        print('--' * 30)
    # endregion