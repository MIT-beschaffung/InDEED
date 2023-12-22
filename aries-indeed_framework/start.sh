#!/bin/bash

SLEEPTIME=150
FILE=".env"
GREEN="\e[0;32m"
RESET="\e[0m"

if [[ $# -ne 2 ]]
  then
  echo "usage: ./start.sh API_KEY DB_KEY"
  exit 0
fi

API_KEY=$1
DB_KEY=$2

# echo -e "VAULT_KEYS=\nVAULT_TOKEN=\nAPP_ROLE=indeed-backend\nROLE_ID=\nSECRET_ID=\nAPI_KEY=${API_KEY}\nDB_KEY=${DB_KEY}\nLOG_LEVEL=WARN\nSECURITY_LEVEL=production\nquorum_ip_address=quorum_quorum-node1_1\nquorum_port=8545" > ./backend/.env

echo "Stopping all running containers ..."
./stop.sh

echo "Remove old secret vault and data bases..."
sudo rm -rf ../vault
sudo rm -rf ../data
cd backend
sudo rm -rf data

echo "Building secret vault ..."
docker-compose up -d --build secret-vault
sleep 15
docker-compose up -d authentication
sleep $SLEEPTIME

echo -n "Init secret vault and build env file ..."
rm $FILE
i=0
for STR in "Unseal Keys" "Root token" "Role ID" "Secret-ID"
do
  #TODO: file wird von  cat nicht gefunden
res[i]=$(sudo cat "/var/log/indeed/AUTHENTICATION-$(date +%F).log" | grep "$STR" | tail -1 | sed -n "s/.*$STR: //p" |sed $'s,\x1b\\[[0-9;]*[a-zA-Z],,g')
i=$i+1
done
echo -e "VAULT_KEYS=\"${res[0]}\"\nVAULT_TOKEN=${res[1]}\nAPP_ROLE=indeed-backend\nROLE_ID=${res[2]}\nSECRET_ID=${res[3]}\nAPI_KEY=${API_KEY}\nDB_KEY=${DB_KEY}\nLOG_LEVEL=WARN\nSECURITY_LEVEL=production\nquorum_ip_address=quorum_quorum-node1_1\nquorum_port=8545" > "./.env"
echo -e "$GREEN done $RESET"

echo -n "Set secret vault permissions ..."
sudo chgrp -R docker ../../vault && sudo chmod -R g+rw ../../vault
echo -e "$GREEN done $RESET"

echo "Deploying the backend API and MongoDB and the consumer backend API and MongoDB"
cp package-lock.json.backup package-log.json
docker-compose build ubt dbubt authentication dbusers
docker-compose up -d ubt dbubt owner dbowner mongo-express authentication dbusers secret-vault

sleep $SLEEPTIME
consumer_counter=1
number_of_consumer=3
while [ $consumer_counter -le $number_of_consumer ]
do
  docker-compose up -d consumer${consumer_counter} dbconsumer${consumer_counter}
  consumer_counter=$(( $consumer_counter + 1 ))
done
# TODO for loop für consumer0x
docker-compose up -d consumer01 consumer02 consumer03 consumer04 consumer05 consumer06 consumer07 consumer08 consumer09 consumer10 consumer11 consumer12 consumer13 consumer14 consumer15 consumer16 consumer17
cd ..


cd quorum
echo "Pulling the Quorum  docker images"
docker-compose build quorum-node1 quorum-node2 quorum-node3
echo "Starting the local Quorum network"
docker-compose up -d quorum-node1 quorum-node2 quorum-node3
echo ""
echo "Waiting 10 seconds until the Quorum network is running"
sleep 10
echo ""


echo "Building the remaining components  -- this can take around 20 minutes"
docker-compose build truffle-migrator
echo "Starting the truffle migrator"
docker-compose up -d truffle-migrator
echo ""
cd ..


cd zkp
echo "Building the zkp-service"
docker-compose build
docker-compose up -d
echo ""
cd ..


cd optimization
docker login --username jfffe --password UjbQO1JcVq1ydpeOchtW
echo "Building the opt-service"
docker-compose build
docker-compose up -d
docker logout
echo ""
cd ..


#echo "Deploying ownerfrontend"
#cd angular-ownerfrontend
#docker-compose build
#docker-compose up -d
#cd ..

echo "Deploying nginx"
cd frontend
docker-compose build
docker-compose up -d nginx
cd authentication
docker-compose build
docker-compose up -d auth-frontend
cd ..
frontend_counter=1
while [ $frontend_counter -le $number_of_consumer ]
do
  docker-compose up -d frontend${frontend_counter}
  frontend_counter=$(( $frontend_counter + 1 ))
done
# TODO loop for frontend0x
docker-compose up -d frontend01 frontend02 frontend03 frontend04 frontend05 frontend06 frontend07 frontend08 frontend09 frontend10 frontend11 frontend12 frontend13 frontend14 frontend15 frontend16 frontend17
echo ""
cd ..

# echo "Rebuilding react app"
# docker exec react-consumerfrontend sh -c "npm run build"

# echo "Starting remaining components"
# docker-compose up -d

