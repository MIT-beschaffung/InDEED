import socketIOClient from "socket.io-client";

const node_config = require("../node_config.json");

const search = window.location.search;
const params = new URLSearchParams(search);
MyLogger.debug(params.get('node'));
const nodeType = params.get('node');
const nodeConf= node_config.find((e)=> e.name == nodeType);
const  socket =  socketIOClient("http://"+ nodeConf.socket_endpoint_url + ":" +
    nodeConf.socket_endpoint_port, {transports: ['websocket', 'polling', 'flashsocket']});
export {socket,  nodeConf ,nodeType};