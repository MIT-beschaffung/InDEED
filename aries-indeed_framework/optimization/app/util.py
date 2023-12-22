from flask import request
from functools import wraps
import os

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        print(request.headers)
        if 'api_key' in request.headers:
            token = request.headers.get('api_key')

        if not token:
            return {'message': '"api_key" in headers is missing'}, 401

        if token != os.environ.get('API_KEY'):
            return {'message': '"api_key" in headers is wrong: ' + str(os.environ.get('API_KEY'))}, 401

        return f(*args, **kwargs)

    return decorated
