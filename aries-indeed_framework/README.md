# InDEED_Universal

This is the main Repo for InDEED.

## A note on DevOps

Please merge the tested and ready-for production components into the 'main' branch; ensure to speak to another team member before doing this. Please merge all tested components into the 'dev' branch, and create a new sub-branch for each logical module you are building. Within this sub-branch, please use individual branches (again) for each '/feature' and '/fix' you are building.

Branch structure:  
main  
dev  
--dev_universal  
----feature_branch  
--dev_assetlogging  
----feature_branch  
--dev_labeling  
----feature_branch  


## Get started

To bootstrap and start the InDEED compoments for asset logging and labeling, go to 
```cd aries-indeed-framework``` and run ```./start.sh```.

<span style="color:red">__CAUTION: THIS WILL STOP AND REMOVE ALL RUNNING DOCKER CONTAINERS ON YOUR HOST!!!__</span>.

This script will then build and start the following components: 

- the __nestjs-owner__ (REST API for asset logging and labeling)
- a 3-node local __quorum network__ (quorum_quorum-node1_[1-3])
- a bootstrapping __migration__ container (quorum_truffle-migrator) that does the trusted setup and deploys asset logging and labeling ZKP verifier smart contracts
- The __zkp-service__ (REST API for internal purposes to outsource some tasks related to witness and proof generation).


## How to install docker and docker-compose

```sudo apt-get install docker.io```

```sudo apt-get install docker-compose```

```docker-compose --version```

We need docker-compose version 1.29 or higher. If the version is lower, see [here](https://docs.docker.com/compose/install/).

If there are permissioning issues with docker, try

```sudo groupadd docker```

``` sudo usermod -aG docker $USER```

```newgrp docker```

Now logout and log in then it should work. For details, see [here](https://docs.docker.com/engine/install/linux-postinstall/).


## Docker 1&1

Details about 

```docker-compose build```, 
```docker-compose up (-d)```,
```docker-compose down (--no-cache)```, 
```docker logs```, 
```docker exec -it <<container-name>> sh```

and other useful stuff.

Hack for private IP on server: 

``docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 dockernet``


## A note on git
Please pull recursively to consider submodules.
If you forgot to pull recursivley (Error --> Can't find file from submodule), you can fix this using the command:

``git submodule update --init --recursive``


## A note on firewall settings
When working on a server, first make sure ssh is not blocked when the firewall is started:
```sudo ufw allow ssh

Then start the firewall:
```sudo ufw enable

To allow additional ports (here: the nginx or backend port) do
```ufw allow $PORT

To disable the firewall, use
```ufw disable

Make sure that only the nginx docker port mapping is enabled as this seems to overwrite firewall settings. 
To look for remaining open ports, the following commands may be useful: 

```nmap 94.16.107.106 -p 38959 -Pn```

```sudo lsof -i -P -n | grep LISTEN```

```sudo netstat -tulpn | grep LISTEN```


## INDEED SSI APP

This folder structure contains several executable scripts:

* tsc && node indeed: An automatic execution of the process, which is completely coordinated via the file indeed.ts.
* sh ./example/start_example.sh: An automatic execution of the process, which is coordinated decentrally and can therefore also be executed from different devices.
* sh ./start_react_example.sh: Creation of various frontends, allowing the user to coordinate the process himself. Decentralised possible 

##Setup
Initially do:
npm install
cd web_app
npm install 
cd ../../aries-cloudagent
python3 -m pip install .

If errors occurr in the "Index" file: 
nvm install (node version manager)
Update to latest node version
http://localhost:3000/?node=TUEV


## Generally Important Data

### indeedAriesClient
This client manages all the important functions that are required for the individual processes. These include indeedWebhookhandler, indeedEthereumClient. The class also inherits from ariesClient.
indeedAriescliennt is therefore always the client that should be addressed by the user.

###ariesClient
This client contains all commands that can be sent to the agent via HTTP Post and Get Requests.

### indeedWebhookHandler
The indeedWebhookhandler listens to the webhooks sent by the agent and then passes them to the indeedAriesCLient, which processes them further.
The agent can use webhooks to send information to the user. (e.g. message received)


## Config Files
config.json: Particularly important for the indeed.ts file. Information usually does not need to be changed. Debug level is found here
./expample/config_example: Particularly important for the decentralised example process, the nodes must know their mutual endpoints
./web_app/node_config: Important for the React app + frontend. Here, too, the nodes must know each other.

## Agents
In addition to the eigtl SKripts, the agents can also be started separately with sh ./start_agents.

##React
The Reactapp is divided into several components. The content that is displayed differs depending on which node opens the Reactapp. 
The individual components each represent a process step. 
Communication with the backend works via socket.io: The backend_for_react file hosts its own server for this purpose.
This file also creates an instance of indeedAriesClient in order to be able to communicate with the agent. 
The Material UI library is integrated in the frontend.
In the file start_react_example you can read what is required to set up the forntend.
In the browser, passing the "node" URL parameter makes it clear which node is involved.
Without this addition, the websites will not open correctly
there are
? node =  TUEV | BNA | EVU | PLANT

The Procedure is as follows:
- register to the ledger
- DID -> Public
- Evtl Connections
- Credential Issue
- Credential Presentation
- Messaging


## Example
Basic non-SSI communications between the nodes are made by communicationBesideAriesHadnler via HTTP.

WaitTillFunctions wait for certain webhooks sent by the agent. 
E.g. Connection established, Message received...

Have fun.
