#!/bin/bash

set -a
source ../backend/.env
set +a


# url=localhost
url=indeed-energy.de

for value in lew liqwotec rheinenergie schweiger sma
do

    # echo $value
    # echo 'Posting data to https://'$url'/'$value'/logData'
    # res=$(curl -s --insecure -X 'POST' \
    #   'https://'$url'/'$value'/logData' \
    #   -H 'accept: */*' \
    #   -H 'api_key: ${API_KEY}' \
    #   -H 'Content-Type: application/json' \
    #   -d '{"key": "value"}' \
    # | jq .owner | sed -e 's/"//g')

    # echo $res

    # if [ "${value,,}" = "${res,,}" ]; then
    #     echo ":)"
    # else
    #     echo "Failed with "$value
    #     exit 1
    # fi

    echo 'Getting data from https://'$url'/'$value'/logData'
    res=$(curl -s --insecure -X 'GET' \
      'https://'$url'/'$value'/' \
      -H 'accept: */*' \
      -H 'api_key: ${API_KEY}' \
      | jq | wc -l)

    echo 'Found '$res' results'


    echo 'Posting data to https://'$url'/'$value'/logData'
    res=$(curl -s --insecure -X 'POST' \
      'https://'$url'/'$value'/logData' \
      -H 'accept: */*' \
      -H 'api_key: ${API_KEY}' \
      -H 'Content-Type: application/json' \
      -d '{"key": "value"}' \
    | jq ._id | sed -e 's/"//g')

    echo $res

    echo -e '\nGetting id from logData'
    curl -s --insecure -X 'GET' \
      'https://'$url'/'$value'/'$res \
      -H 'accept: */*' \
      -H 'api_key: ${API_KEY}'

    echo -e '\nDeleting id from logData'
    curl -s --insecure -X 'DELETE' \
      'https://'$url'/'$value'/'$res \
      -H 'accept: */*' \
      -H 'api_key: ${API_KEY}'

    echo -e '\nGetting id from logData'
    res=$(curl -s --insecure -X 'GET' \
      'https://'$url'/'$value'/'$res \
      -H 'accept: */*' \
      -H 'api_key: ${API_KEY}')
    echo 'Result: '$res 'found'

     if [ $res ==   ]; then
        echo ':)'
     else
         echo 'No successful removal with '$value
         exit 1
     fi
done
