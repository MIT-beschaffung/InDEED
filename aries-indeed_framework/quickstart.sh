#!/bin/bash

docker stop $(docker ps -aq) > /dev/null
docker container rm $(docker ps -aq) > /dev/null


echo "Deploying the backend API and MongoDB"
cd backend
# docker-compose build owner dbproducer
docker-compose up -d secret-vault authentication
sleep 60
# docker-compose up -d ubt dbubt consumer1 consumer2 consumer3 consumer01 consumer02 consumer03 consumer04 consumer05 consumer06 consumer07 consumer08 consumer09 consumer10 consumer11 consumer12 consumer13 consumer14 consumer15 consumer16  consumer17 \
#  dbconsumer1 dbconsumer2 dbconsumer3 dbconsumer01 dbconsumer02 dbconsumer03 dbconsumer04 dbconsumer05 dbconsumer06 dbconsumer07 dbconsumer08 dbconsumer09 dbconsumer10 dbconsumer11 dbconsumer12 dbconsumer13 dbconsumer14 dbconsumer15 dbconsumer16  dbconsumer17 \
docker-compose up -d ubt dbubt dbusers owner dbowner mongo-express
sleep 60
docker-compose up -d consumer1 consumer2 consumer3 consumer01 consumer02
echo ""
cd ..

sleep 30

cd quorum
# echo "Pulling the Quorum  docker images"
# docker-compose build quorum-node1 quorum-node2 quorum-node3
echo "Starting the local Quorum network"
docker-compose up -d quorum-node1 quorum-node2 quorum-node3
echo ""
# echo "Waiting 10 seconds until the Quorum network is running"
# sleep 30
# echo ""
cd ..
sleep 15



cd zkp
# echo "Building the zkp-service"
# docker-compose build
docker-compose up -d
echo ""
cd ..

sleep 15

cd optimization
# echo "Building the opt-service"
# docker-compose build
# docker-compose up -d

docker login --username jfffe --password UjbQO1JcVq1ydpeOchtW

docker-compose up -d opt-service

docker logout
echo ""
cd ..

sleep 5

# echo "Starting remaining components"
# docker-compose up -d

#echo "Deploying the owner frontend"
#cd angular-ownerfrontend
#docker-compose up -d
#echo ""
#cd ..

sleep 30

echo "Deploying the consumer frontend and nginx"
cd frontend
# docker-compose up -d frontend01 frontend02 frontend03 frontend04 frontend05 frontend06 frontend07 frontend08 frontend09 frontend10 frontend11 frontend12 frontend13 frontend14 frontend15 frontend16 frontend17
docker-compose up -d frontend01  frontend1 frontend2 frontend3 nginx
cd authentication
docker-compose up -d auth-frontend
cd ..
echo ""
cd ..

sleep 100

# echo "Rebuilding react app"
# docker exec react-consumerfrontend1 sh -c "npm run build"

echo "Starting the truffle migrator"
cd quorum
# echo "Building the remaining components  -- this can take around a minute"
# docker-compose build truffle-migrator
docker-compose up -d truffle-migrator
echo ""
cd ..

sleep 10