#!/bin/bash

# ubt:
docker restart nestjs-ubt

# consumer:
docker restart nestjs-consumer1
docker restart nestjs-consumer2
docker restart nestjs-consumer3
    
# probanden:
docker restart nestjs-consumer01
docker restart nestjs-consumer02
docker restart nestjs-consumer03
docker restart nestjs-consumer04
docker restart nestjs-consumer05
docker restart nestjs-consumer06
docker restart nestjs-consumer07
docker restart nestjs-consumer08
docker restart nestjs-consumer09
docker restart nestjs-consumer10
docker restart nestjs-consumer11
docker restart nestjs-consumer12
docker restart nestjs-consumer13
docker restart nestjs-consumer14
docker restart nestjs-consumer15
docker restart nestjs-consumer16
docker restart nestjs-consumer17

# nginx:
docker restart nginx