"""
- parsing and validation of input data for the optimization
- performing the optimization (using the Timestep class)
"""
import pandas as pd
from timestep import Timestep
from json import dumps
from numpy import array
from datetime import datetime

import logging

flask_logger = logging.getLogger("flask_logger")
# flask_logger = logging.getLogger(__main__)
flask_logger.warning('logging a warn message from outside main.py')
flask_logger.debug('logging a debug message from outside main.py')

# global constants
KEYS = ['con', 'con', 'dist_con_gen']
TIMESTEP_NO = -1
EXTERNAL_ID = str(-1)
EXTERNAL_COST_FACTOR = 10e3


def preparse_input(in_json: dict):
    # flask_logger.debug("Prepareing input")
    flask_logger.warn("Prepareing input")
    con_ids, con_vals = tuple(in_json['consumers'])
    gen_ids, gen_vals = tuple(in_json['generators'])
    cost_matrix = array(in_json['cost_matrix'])
    bypass_ids = array(in_json['loggedProsumerIds'])
    bypass_locations = array(in_json['locations'])
    bypass_sources = array(in_json['sources'])
    bypass_prosumer_names = array(in_json['prosumer_names'])

    return con_ids, con_vals, gen_ids, gen_vals, cost_matrix, bypass_ids, bypass_locations, bypass_sources, bypass_prosumer_names


def validate_input(in_json: dict):
    con_ids, con_vals, gen_ids, gen_vals, cost_matrix, bypass_ids, bypass_locations, bypass_sources, bypass_prosumer_names = preparse_input(in_json)

    # check if consumption/generation values can be casted to floats
    try:
        con_vals = list(map(float, con_vals))
        gen_vals = list(map(float, gen_vals))
    except ValueError:
        return False, 'non-numeric values are only allowed as ID\'s'

    # check if the shapes of the arrays match
    if not (len(con_ids) == len(con_vals) and len(gen_ids) == len(gen_vals)) \
            and cost_matrix.shape == (len(con_ids), len(gen_ids)):
        msg = 'shapes of input lists do not match'
    # check if relevant values are all positive
    elif (array(con_vals + gen_vals) < 0).any() or (cost_matrix < 0).any():
        msg = 'negative values are not allowed'
    else:
        return True, ''

    return False, msg


def parse_input(in_json: dict):
    con_ids, con_vals, gen_ids, gen_vals, cost_matrix, bypass_ids, bypass_locations, bypass_sources, bypass_prosumer_names = preparse_input(in_json)

    # values for consumption/generation come as strings, so cast them to float
    con_vals, gen_vals = list(map(float, con_vals)), list(map(float, gen_vals))

    # DataFrame containing energy amount of consumers (positive values)
    # index = consumer IDs
    con = {str(k): [v] for k, v in zip(con_ids, con_vals)}
    con_df = pd.DataFrame(con).T

    # DataFrame containing energy amount of generators (positive values)
    # index = generator IDs
    gen = {str(k): [v] for k, v in zip(gen_ids, gen_vals)}
    gen_df = pd.DataFrame(gen).T

    # DataFrame containing distances between consumers and generators
    # index = consumer IDs
    # columns = generator IDs
    cost_matrix_df = pd.DataFrame(cost_matrix, index=con_ids, columns=gen_ids)

    return con_df, gen_df, cost_matrix_df, bypass_ids, bypass_locations, bypass_sources, bypass_prosumer_names


def optimize(input_json: dict):
    try:

        epoch_now = int(datetime.now().timestamp())

        flask_logger.info("Parsing inputs")
        con_df, gen_df, cost_matrix_df, bypass_ids, bypass_locations, bypass_sources, bypass_prosumer_names = parse_input(input_json)

        flask_logger.debug("Locations:")
        flask_logger.debug(bypass_locations)

        # add external energy source
        consumption = con_df.values.sum()
        generation = gen_df.values.sum()
        energy_diff = abs(consumption - generation)

        # get maximum value of cost matrix
        max_cost = cost_matrix_df.max().max()

        # depending on energy surplus or shortage
        if consumption > generation:
            # add difference to generators
            gen_df.loc[EXTERNAL_ID] = energy_diff
            cost_matrix_df.loc[:, EXTERNAL_ID] = max_cost * EXTERNAL_COST_FACTOR
        else:
            # add difference to consumers
            con_df.loc[EXTERNAL_ID] = energy_diff
            cost_matrix_df.loc[EXTERNAL_ID, :] = max_cost * EXTERNAL_COST_FACTOR

        flask_logger.info("Ready to optimize")
        # perform matching of consumers and generators
        x = Timestep(t_=TIMESTEP_NO,
                 con_=con_df,
                 gen_=gen_df,
                 cost_matrix_=cost_matrix_df,
                 external_id_=EXTERNAL_ID)
        flask_logger.info("x created")
        success = ""
        code = ""
        try:
            flask_logger.info("Starting Gurobi optimization")
            success, code = x.optimize()
            flask_logger.info(success)
            flask_logger.info(code)
        except Exception as e:
            flask_logger.info("Problem when optimizing")
            flask_logger.info(e)

        flask_logger.info("Optimization done")

        # return optimization status code if it failed
        if not success:
            msg = f'Optimization failed with status code {code}'
            return success, dumps({'message': msg})

        flask_logger.info("Optimization successful")
        # x.result contains one transaction between consumer and generator per row
        res = x.result
        res['share_rel'] = res['share_rel'].astype(float)
        # join generation to result
        res = pd.merge(res, gen_df, left_on='id_gen', right_index=True)
        res = res.rename(columns={0: 'gen'})
        # calculate absolute share
        res['share_abs'] = res['share_rel'] * res['gen']
        # pivot the table to shape n_consumers x n_generators
        res = res.pivot(index='id_con', columns='id_gen',
                        values='share_abs').fillna(0)
        # order index to match original order of consumer IDs
        res = res.reindex(index=con_df.index, fill_value=0)
        # order columns to match original order of generator IDs
        res = res.reindex(columns=gen_df.index, fill_value=0)

        res_dict = {'epoch': epoch_now}
        res_dict['transactions_abs'] = [list(row) for row in res.values.round(3)]
        res_dict['consumer_ids'] = list(res.index)
        res_dict['generator_ids'] = list(res.columns)
        res_dict['loggedProsumerIds'] = list(bypass_ids)
        res_dict['locations'] = bypass_locations.tolist()
        res_dict['sources'] = list(bypass_sources)
        res_dict['prosumer_names'] = list(bypass_prosumer_names)

        print("Optimization successful")

        flask_logger.info("Returning result")
        flask_logger.debug(dumps(res_dict))

        return success, dumps(res_dict)

    except Exception as e:
        flask_logger.info(e)
        return False, dumps({'message': e})

