#!/bin/bash

docker stop $(docker ps -aq) > /dev/null
docker container rm $(docker ps -aq) > /dev/null


echo "Deploying the backend API and MongoDB"
cd backend
# docker-compose build owner dbproducer
docker-compose -f docker-compose_additionalConsumers.yml up -d ubt dbubt consumer1 dbconsumer1 consumer2 dbconsumer2 consumer3 dbconsumer3 consumer4 dbconsumer4 consumer5 dbconsumer5 consumer6 dbconsumer6 consumer7 dbconsumer7 consumer8 dbconsumer8 owner dbowner mongo-express
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

cd optimization
# echo "Building the opt-service"
# docker-compose build
# docker-compose up -d
docker-compose up -d opt-service

echo ""
cd ..

sleep 10

# echo "Starting remaining components"
# docker-compose up -d

echo "Deploying the owner frontend"
cd angular-ownerfrontend
docker-compose up -d
echo ""
cd ..

sleep 10

echo "Deploying the consumer frontend and nginx"
cd frontend
docker-compose -f docker-compose_additionalConsumers.yml up -d frontend1 frontend2 frontend3 frontend4 frontend5 frontend6 frontend7 frontend8 nginx
echo ""
cd ..

# echo "Rebuilding react app"
# docker exec react-consumerfrontend1 sh -c "npm run build"
