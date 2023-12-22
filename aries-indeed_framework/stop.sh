#!/bin/bash

if [[ $(docker ps -aq) ]]; then
  echo "There are running or stopped docker containers"
  echo "Stopping and removing all running containers"
  docker stop $(docker ps -aq) > /dev/null
  docker rm -f $(docker ps -aq) > /dev/null
  docker volume rm $(docker volume ls -q) > /dev/null
else
  echo "No running or stopped docker containers found"
  echo "Nothing to do"
fi
echo ""