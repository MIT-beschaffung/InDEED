const dotenv = require("dotenv");
dotenv.config();
const ipAddress = process.env.ip_address;
const port = process.env.port;

console.log("Quorum node ip address: " + ipAddress);
console.log("Quorum node port: " + port);

module.exports = {
  networks: {
    quorum: {
       host: ipAddress,
       port: port,
       network_id: "*",
       gasPrice: 0,
       gas: 30000000,
       type: "quorum"
    }
  },
  compilers: {
    solc: {
      version: "^0.6"
    }
  }
};

