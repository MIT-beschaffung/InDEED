from docplex.mp.model import Model
from sys import stdout
from pandas import DataFrame, merge
import numpy as np


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
        d = np.multiply(self.costs, self.gen)

        # region formalize problem (using docplex package)
        mdl = Model(name=f'ts_{self.t}')

        # decision variables
        z = mdl.continuous_var_matrix(list(range(self.n_con)), list(range(self.n_gen)), lb=0, ub=1,
                                      name='z')

        # formulate constraints (using docplex package)
        # The constraints are formulated depending on wether the residual load is positiv or negativ.
        # This is accomplished by dynamically defining the number of consumers/generators when creating the constraints.
        # consumers: every consumer has to obtain 100% of its demand (except external energy sink)
        mdl.add_constraints([mdl.scal_prod([z[c, g] for g in range(self.n_gen)],
                                           [self.gen[g] for g in range(self.n_gen)]) == self.con[c] for c in range(
            self.n_con - (0 if self.external_id in self.ids_gen else 1))])
        # generators: every generator has to deliver 100% of its generation (except external energy source)
        mdl.add_constraints([mdl.sum_vars([z[c, g] for c in range(self.n_con)]) == 1 for g in
                             range(self.n_gen - (1 if self.external_id in self.ids_gen else 0))])

        # formalize problem
        mdl.minimize(mdl.sum(
            [mdl.scal_prod([z[c, g] for g in range(self.n_gen)], [d[c][g] for g in range(self.n_gen)])
             for c in range(self.n_con)]))
        # endregion

        # region solve problem (using cplex package)
        mdl_cplex = mdl.get_cplex()  # convert docplex model object into cplex model object

        # activate/deativate logging
        # when logging is desired replace "None" with "stdout" (defined above)
        mdl_cplex.set_results_stream(None)
        mdl_cplex.set_warning_stream(None)
        mdl_cplex.set_error_stream(None)
        mdl_cplex.set_log_stream(None)
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

        status_code = mdl_cplex.solution.get_status()

        if status_code not in [1, 5]:
            return False, status_code

        tmp_ergebnis = None
        for var, (idx, val) in zip(mdl_cplex.variables.get_names(), enumerate(mdl_cplex.solution.get_values())):
            if val != 0:
                _val = round(val, 8)
                v, e = self.ids_con[int(var.split('_')[-2])], self.ids_gen[int(var.split('_')[-1])]
                tmp_ergebnis = np.array([v, e, _val]) if tmp_ergebnis is None else np.vstack(
                    [tmp_ergebnis, np.array([v, e, _val])])
        self.result = DataFrame(tmp_ergebnis, columns=['id_con', 'id_gen', 'share_rel'])

        return True, status_code
        # endregion
