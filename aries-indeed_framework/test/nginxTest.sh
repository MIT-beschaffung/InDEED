#!/bin/bash

set -a
source ../backend/.env
set a


for url in consumer1.indeed-energy.de consumer2.indeed-energy.de
do
  # for value in consumer consumer/ consumerfrontend consumerfrontend/
  for value in consumer/ consumerfrontend/
  do
      echo ""
      echo 'path: '$url'/'$value''
      curl --insecure -X 'GET' 'https://'$url'/'$value -H 'accept: */*' -H 'api_key: ${API_KEY}'
      echo " "
  done
done

echo ""
echo "Testing Optimization"
url=opt.indeed-energy.de
curl --insecure -X 'GET' 'https://'$url'/optimize/0' -H 'accept: */*' -H 'api_key: ${API_KEY}'
# ' -H 'accept: */*' -H 'api_key: ${API_KEY}'
echo ""

# echo ""
# echo "Testing masterData"
# curl --insecure -X 'GET' 'https://ubt.indeed-energy.de/masterData/registered' -H 'accept: */*' -H 'api_key: ${API_KEY}'

echo ""
echo "Testing ZKP-Server"
echo ""
url=zkp.indeed-energy.de/zkp
curl --insecure -X 'POST' 'https://'$url'/create-proof' -H 'accept: */*' -H 'Content-Type: application/json' -d '{}'


url=indeed-energy.de

for value in lew liqwotec rheinenergie schweiger sma
do
    echo 'Getting data from https://'$url'/'$value'/logData'
    res=$(curl -s --insecure -X 'GET' \
      'https://'$url'/'$value'/' \
      -H 'accept: */*' \
      -H 'api_key: ${API_KEY}' \
      | jq | wc -l)

    echo 'Found '$res' results'

done
