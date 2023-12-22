import pandas as pd
from json import dumps
import unittest
from main import app
from optimizer import parse_input
from copy import copy


def res_to_df(res):
    return pd.DataFrame(res['transactions_abs'],
                        index=res['consumer_ids'],
                        columns=res['generator_ids'])


def test_data_to_df(test_data):
    return pd.DataFrame(test_data['consumers']).T, pd.DataFrame(
        test_data['generators']).T, pd.DataFrame(test_data['cost_matrix'])


def make_test_data():
    rng = range(1, 5)
    rng_str = [str(r) for r in rng]

    consumers = [['C1', 'C2', '3', '4'], copy(rng_str)]
    generators = [['1', '2', 'G3', 'G4'], copy(rng_str)]
    # row_index = consumer id, column_index = generator id
    cost_matrix = [[0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0]]

    return {
        'consumers': consumers,
        'generators': generators,
        'cost_matrix': cost_matrix
    }


class TestCases(unittest.TestCase):

    def setUp(self):
        app.testing = True
        self.test_app = app.test_client()

        self.data = make_test_data()

        # connection params
        self.HEADER = {'Content-Type': 'application/json'}
        self.OPT_ENDPOINT = 'optimize'

    def get_result(self):
        return self.test_app.post(f'/{self.OPT_ENDPOINT}',
                                  headers=self.HEADER,
                                  data=dumps(self.data)).get_json()

    def test_optimization_endpoint(self):

        # region basic case
        self.data = make_test_data()
        res = self.get_result()
        self.assertEqual(
            res, {
                'transactions_abs': [[1.0, 0.0, 0.0, 0.0], [
                    0.0, 2.0, 0.0, 0.0
                ], [0.0, 0.0, 3.0, 0.0], [0.0, 0.0, 0.0, 4.0],
                                     [0.0, 0.0, 0.0, 0.0]],
                'consumer_ids': ['C1', 'C2', '3', '4', '-1'],
                'generator_ids': ['1', '2', 'G3', 'G4']
            })
        # endregion

        # region undersupply single
        # induce undersupply at consumer 0
        self.data['consumers'][1][0] = '10'
        res = self.get_result()
        self.assertEqual(
            res, {
                'transactions_abs':
                [[1.0, 0.0, 0.0, 0.0, 9.0], [0.0, 2.0, 0.0, 0.0, 0.0],
                 [0.0, 0.0, 3.0, 0.0, 0.0], [0.0, 0.0, 0.0, 4.0, 0.0]],
                'consumer_ids': ['C1', 'C2', '3', '4'],
                'generator_ids': ['1', '2', 'G3', 'G4', '-1']
            })
        # endregion

        # region oversupply single
        self.data = make_test_data()
        # induce oversupply at generator 0
        self.data['generators'][1][0] = '10'
        res = self.get_result()
        self.assertEqual(
            res, {
                'transactions_abs': [[1.0, 0.0, 0.0, 0.0], [
                    0.0, 2.0, 0.0, 0.0
                ], [0.0, 0.0, 3.0, 0.0], [0.0, 0.0, 0.0, 4.0],
                                     [9.0, 0.0, 0.0, 0.0]],
                'consumer_ids': ['C1', 'C2', '3', '4', '-1'],
                'generator_ids': ['1', '2', 'G3', 'G4']
            })
        # endregion

        # region high cost single
        self.data = make_test_data()
        # induce oversupply at generator 0
        self.data['generators'][1][0] = '10'
        # induce undersupply at consumer 1
        self.data['consumers'][1][1] = '10'
        # increase cost for generator 0 and consumer 1
        self.data['cost_matrix'][1][0] = 5
        res = self.get_result()
        self.assertEqual(
            res, {
                'transactions_abs': [[1.0, 0.0, 0.0, 0.0], [
                    1.0, 2.0, 3.0, 4.0
                ], [3.0, 0.0, 0.0, 0.0], [4.0, 0.0, 0.0, 0.0],
                                     [1.0, 0.0, 0.0, 0.0]],
                'consumer_ids': ['C1', 'C2', '3', '4', '-1'],
                'generator_ids': ['1', '2', 'G3', 'G4']
            })


if __name__ == '__main__':
    unittest.main()
