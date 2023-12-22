#!/bin/bash

docker stop $(docker ps -aq) > /dev/null
docker container rm $(docker ps -aq) > /dev/null


echo "Deploying the backend API and MongoDB"
cd backend
# docker-compose build owner dbproducer
docker-compose up -d ubt dbubt consumer dbconsumer owner dbowner mongo-express
echo ""
cd ..

sleep 10

cd quorum
# echo "Pulling the Quorum  docker images"
# docker-compose build quorum-node1 quorum-node2 quorum-node3
echo "Starting the local Quorum network"
docker-compose up -d quorum-node1 quorum-node2 quorum-node3
echo ""
# echo "Waiting 10 seconds until the Quorum network is running"
# sleep 30
# echo ""

# echo "Building the remaining components  -- this can take around a minute"
# docker-compose build truffle-migrator
echo "Starting the truffle migrator"
docker-compose up -d truffle-migrator
echo ""
cd ..

sleep 10


cd zkp
# echo "Building the zkp-service"
# docker-compose build
docker-compose up -d
echo ""
cd ..

sleep 10

# echo "Starting remaining components"
# docker-compose up -d
