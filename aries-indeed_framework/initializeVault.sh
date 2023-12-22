#!/bin/bash

echo "### initialize vault setup ###"

echo "delete vault for rebuild..."
cd ..
sudo rm -rf vault
cd aries-indeed_framework/backend

echo "stop running services ..."
docker-compose down

echo "build authentication service..."
docker-compose up -d authentication

echo "build secret-vault..."
docker-compose up -d --build secret-vault

# echo "restart authentication service..."
# docker restart nestjs-authentication

echo "adjust permissions (PW required)..."
cd ../..
sudo chgrp -R docker vault && sudo chmod -R g+rw vault


echo "restart authentication... "
docker restart nestjs-authentication


echo ""
echo "CAUTION: Before ./start.sh do the following:"
echo "set environment variables for docker services..."

# sleep 10

# keys=docker logs nestjs-authentication | grep -oP "(?<=Unseal Keys: ).*"
# token=docker logs nestjs-authentication | grep -oP "(?<=Root token: ).*"
# role=docker logs nestjs-authentication | grep -oP "(?<=Role ID: ).*"
# secret=docker logs nestjs-authentication | grep -oP "(?<=Secret-ID: ).*"

# cd aries-indeed_framework



# echo "please compare varibles in .env with output:"

echo "CAUTION: Before ./start.sh do the following:"
echo "copy 'Unseal Keys' and 'Root token' and insert it in /backend/.env  as 'keys' and 'root-token' resp."

sleep 10
docker logs nestjs-authentication

echo ""
echo "Execute ./start.sh"