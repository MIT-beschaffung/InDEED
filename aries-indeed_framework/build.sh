#!/bin/bash


echo "Deploying the backend API and MongoDB and the consumer backend API and MongoDB"
cd backend
docker-compose build ubt dbubt
cd ..


cd quorum
echo "Pulling the Quorum  docker images"
docker-compose build quorum-node1 quorum-node2 quorum-node3
echo ""


echo "Building the remaining components  -- this can take around 20 minutes"
docker-compose build truffle-migrator
echo ""
cd ..


echo "Building the zkp-service"
cd zkp
docker-compose build
cd ..

echo "Deploying ownerfrontend"
cd angular-ownerfrontend
docker-compose build
cd ..

echo "Deploying nginx"
cd frontend
docker-compose build
cd ..

# echo "Starting remaining components"
# docker-compose up -d

