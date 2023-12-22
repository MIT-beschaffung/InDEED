from flask import Flask, request, Response
from flask_restx import Api, Resource
from flask_restx.fields import Float, List, String, Integer
from optimizer import optimize, validate_input
from json import dumps, loads
import sqlite3
import time
import requests
import numpy as np
import os
from datetime import datetime
from util import token_required

import logging
from sys import stdout

DATABASE_NAME = 'last_values.db'
CONTENT_TYPE_JSON = 'application/json'

# Max count of entires kept in the database
MAX_RECORDS = 100

authorizations = {
    'apikey': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'api_key'
    }
}

app = Flask(__name__)

api = Api(
    app,
    version='1.0',
    title='InDEED Optimizer API',
    description=
    'API for matching consumption and generation of the InDEED field test',
    default='Endpoints',
    default_label='',
    doc = '/api/',
    authorizations=authorizations,
    security='apikey',
    # prefix = '/optimizer/api/',
    # base_url = '/optimizer'
    )

field_consumers = List(
    List(String),
    required=True,
    default='[["C1","C2","C3","C4"], ["1.0","2.0","3.0","4.0"]]',
    description=
    'n x 2 matrix where first column contains consumers IDs and second column '
    'contains energy amount of the consumers. Energy values must be positive, '
    'all values must be be strings!')

field_generators = List(
    List(String),
    required=True,
    default='[["G1","G2","G3","G4"], ["1.0","2.0","3.0","4.0"]]',
    description=
    'n x 2 matrix where first column contains generators IDs and second column '
    'contains energy amount of the generators. Energy values must be positive, '
    'all values must be be strings!')

field_cost_matrix = List(
    List(Float),
    required=True,
    default='[[0,1,1,1],'
    '[1,0,1,1],'
    '[1,1,0,1],'
    '[1,1,1,0]]',
    description='A n x m matrix containing the transaction costs, where n '
    'equals the number of consumers and m equals the number of generators. '
    'The lower the cost for a pair of a consumer and a generator, the higher '
    'the probability of matching both. The rows correspond to consumers (order '
    'must correspond to the order of the consumer IDs). The columns correspond '
    'to generators (order must correspond to the order of the generator IDs).')

field_bypass_ids = List(
    String,
    required=True,
    default='["1a3b4cd5","2a3b4cd5","3a3b4cd5","4a3b4cd5"]',
    description='An array containing the IDs of LoggedProsumerDatabase to be '
    'bypassed in order to avoid generating an additional database'
)

field_bypass_locations = List(
    List(Float),
    required=True,
    default='[[45.12345678912345,  8.12345678912345],'
    '[48.12345678912345, 10.12345678912345],'
    '[51.12345678912345, 12.12345678912345],'
    '[54.12345678912345, 14.12345678912345]]',
    description='A 2 x n matrix to be bypassed containing latitude and longitude to'
    'of each prosumer i with i out of n+m, corresponding to consumers and producers'
    'in ascending order.'
)

field_bypass_sources = List(
    String,
    required=True,
    default='["hydro","hydro","solar","wind"]',
    description='An array containing the sources of generated power '
)

field_bypass_prosumer_names = List(
    String,
    required=True,
    default='["FfE","Schweiger","SMA","Liqwotec","Rheinenergie", "LEW"]',
    description='An array containing the prosumer_names name (readable) '
)

field_transactions_abs = List(
    List(Float),
    required=True,
    default='[[1,0,0,0],'
    '[0,2,0,0],'
    '[0,0,3,0],'
    '[0,0,0,4],'
    '[0,0,0,0]]',
    description='A n x m matrix containing the transactions of energy amounts '
    '(same unit as the input values) between consumers and generators, where '
    'n equals the number of consumers and m equals the number of generators.')

field_consumer_ids = List(
    String,
    default='["C1","C2","C3","C4","-1"]',
    required=True,
    description='Consumer IDs, i.e. row indices of the transaction matrix. '
    'The ID "-1" refers to a dummy consumer that absorbs oversupply.')

field_generator_ids = List(
    String,
    default='["G1","G2","G3","G4"]',
    required=True,
    description='Generator IDs, i.e. column indices of the transaction matrix. '
    'The ID "-1" refers to a dummy generator that covers undersupply, i.e. '
    'grey electricity.')

field_epoch = Integer(required=True,
                      description='The time of the optimization as Unix Epoch Timestamp')

# define the input data model and default values (default serves as example)
input_data_model = api.model('input data model', {
    'consumers': field_consumers,
    'generators': field_generators,
    'cost_matrix': field_cost_matrix,
    'loggedProsumerIds': field_bypass_ids,
    'locations': field_bypass_locations,
    'sources': field_bypass_sources,
    'prosumer_names': field_bypass_prosumer_names
},
                             strict=True)

output_data_model = api.model('output data model', {
    'epoch': field_epoch,
    'transactions_abs': field_transactions_abs,
    'consumer_ids': field_consumer_ids,
    'generator_ids': field_generator_ids,
    'loggedProsumerIds': field_bypass_ids,
    'locations': field_bypass_locations,
    'sources': field_bypass_sources,
    'prosumer_names': field_bypass_prosumer_names
},
                              strict=True)


@api.route('/optimize')
class Optimize(Resource):
    @api.expect(input_data_model, validate=True)
    @api.response(200, 'optimization successful', output_data_model)
    @api.response(400, 'invalid input data')
    @api.response(500, 'optimization failed')
    @token_required
    def post(self):
        # print("Optimizing input")
        try:
            in_json = request.get_json()
            # print(dumps(in_json))
            # read input

            # validate input
            is_valid, msg = validate_input(in_json)
            if not is_valid:
                # print("Input invalid")
                return Response(dumps({'message': msg}),
                                status=400,
                                content_type='application/json')

            # perform optimization
            success, result = optimize(in_json)

            # return result
            if not success:
                # print("Result not successful")
                return Response(result,
                                status=400,
                                content_type='application/json')
            # print("Result successful")

            # Save the computed result and delete the oldest entry of the database if needed
            saveToDatabase(result)
            deleteOldRecords(MAX_RECORDS)

            # webhook: send to ubt endpoint
            # print('trigger Webhook')
            print(datetime.now().strftime("%A %d-%m-%y - %H:%M:%S"))
            out = sendResponse(result)
            # @api.route('/labeling/receiveOptimizationWebhook')#, method=["POST"], content_type=json)
            # out = requests.post('http://nestjs-ubt:8105/labeling/receiveOptimizationWebhook', result)
            # print(out)

            shape = str(np.array(loads(result)['transactions_abs']).shape)
            time = str(int(datetime.utcnow().timestamp()))
            msg = ('successful, shape : ' + shape + ', time : ' + time) # TODO add matrix shape and timestamp
            return Response(dumps({'message': msg}),
                            status=200,
                            content_type='application/json')
        except Exception as e:
            print("Error")
            print(e)
            # return Response(result, status=500, content_type='application/json')
            return Response({}, status=500, content_type='application/json')

# webhook: send result to ubt backend
def sendResponse(result):
    # print('Send result ...')
    # print(result)
    try:
        resp = requests.post('http://nestjs-ubt:8105/labeling/receiveOptimizationWebhook',
         headers={'api_key': str(os.environ.get('API_KEY')) }, json=loads(result))
        print(resp)
    except Exception as e:
        print(e)
        print("Webhook could not be delivered - maybe the InDEED backend is not running?")
    
    resp.raise_for_status()
    return resp.status_code


@api.route('/optimize/<epoch>')
@api.response(200, 'Succesfully send data', output_data_model)
@api.response(400, "Non valid epoch given")
class History(Resource):
    @token_required
    def get(self, epoch):
        # Fails if index isn't an int or is negative
        if not epoch.isdigit():
            return Response(
                status=400,
                response="The given epoch must be a non-negative integer",
                content_type=CONTENT_TYPE_JSON)

        response = get_value_by_timestamp(epoch)
        if response:
            return Response(status=200, response=response)
        else:
            return Response(status=400,
                            response=f"no entry found for epoch {epoch}",
                            content_type=CONTENT_TYPE_JSON)


@api.route('/optimize/get_all_timestamps')
@api.response(200, 'Succesfully sent data')
class HistoryList(Resource):
    @token_required
    def get(self):
        response = get_history_list()
        if response:
            return Response(status=200, response=response)
        else:
            return Response(status=400,
                            response="no history data available")
                            
def get_history_list():
    """
    Returns the epoch timestamp for all rows in the
    database sorted by epoch.
    """
    con = sqlite3.connect(DATABASE_NAME)
    cur = con.cursor()
    cur.execute(
        "SELECT json_extract(result, '$.epoch') AS epoch "
        "FROM optlogs "
        "ORDER BY 1")
    result = cur.fetchall()
    con.close()
    return dumps([x[0] for x in result]) if len(result) > 0 else None

def initializeDatabase():
    """
    Creates the table for the result history if it does not exist.
    """
    con = sqlite3.connect(DATABASE_NAME)
    con.execute(
        "CREATE TABLE IF NOT EXISTS optlogs(epoch int PRIMARY KEY,result json)"
    )
    con.close()


def saveToDatabase(json_data):
    """
    Stores the optimization result in the database along with a timestamp.
    """
    con = sqlite3.connect(DATABASE_NAME)
    con.execute("INSERT INTO optlogs VALUES (?,?)", [loads(json_data)['epoch'], json_data])
    con.commit()
    con.close()


def get_value_by_timestamp(epoch: int):
    """
    Returns the value stored in the database corresponding to the given epoch.
    """
    con = sqlite3.connect(DATABASE_NAME)
    cur = con.cursor()
    cur.execute(
        "SELECT result FROM optlogs "
        "WHERE epoch = ?", (epoch, ))
    result = cur.fetchone()
    con.close()

    if not result or len(result) == 0:
        return None

    return result


def deleteOldRecords(count):
    """
    Only keeps the count last records.
    """
    con = sqlite3.connect(DATABASE_NAME)
    con.execute(
        "DELETE FROM optlogs "
        "WHERE epoch NOT IN "
        "(SELECT epoch FROM optlogs ORDER BY epoch DESC LIMIT ?)", (count, ))
    con.commit()
    con.close()


if __name__ == '__main__':

    # get the relvant loggers from flask and werkzeug
    flask_logger, werkzeug_logger = app.logger, logging.getLogger('werkzeug')

    # create handler for logging debug level to file and add it to loggers
    debug_file_handler = logging.FileHandler('opt_debug.log', encoding='utf-8')
    debug_file_handler.setLevel(logging.DEBUG)
    flask_logger.handlers.append(debug_file_handler)
    werkzeug_logger.handlers.append(debug_file_handler)

    # modify the existing logger to log warn level to stdout
    flask_logger.handlers[0].setLevel(logging.WARN)
    flask_logger.handlers[0].setStream(stdout)

    # copy the flask warn-handler to the werkzeug logger
    werkzeug_logger.handlers.append(flask_logger.handlers[0])
    flask_logger.info('initialize database')
    flask_logger.debug('this is a debug level message')
    initializeDatabase()
    flask_logger.info('starting app')
    app.run(host='0.0.0.0', port=5000, debug=True)
