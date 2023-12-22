import  React  from 'react';
import './App.css';
import Connection from './components/Connection';
import DidInfo from './components/DidInfo';
import EthInfo from './components/EthInfo';
import CredentialIssue from './components/CredentialIssue';
import CredentialCreation from './components/CredentialCreation';
import CredentialPresentation from './components/CredentialPresentation';
import Messages from './components/Messages';
import Claim from './components/Claim';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import {socket, nodeConf, nodeType} from "./service/socket";
import icons from "./assets/icons";
import ClaimReceipt from "./components/ClaimReceipt";


const boxProps = {
    borderColor: 'primary.light',
    borderRadius: "borderRadius",
    style: { padding: 16 }
};


function App() {



    if(nodeType === undefined ) {
        console.error("Undefined Node Type");

    }

    socket.on("connected", () =>{
        MyLogger.debug( "Connected to server.");
    });
    socket.on( "disconnected", () => {
        MyLogger.debug("Server disconnected" );
    })
    return (
    <div className="App">

        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Box border={4}  {...boxProps} alignItems="center"  display="flex">
                    <img src={ nodeType == null ? icons["BNA"]: icons[nodeType]} height="80px"/>
                    <h1 style={{ margin: 8 , display: 'inline'}}>
                        INDEED SSI WEBAPP {nodeConf.name} &nbsp;

                    </h1>

                </Box>
            </Grid>
            <Grid item xs={12} >
                <Box border={2}  {...boxProps} >
                    <h2 style={{ margin: 8 }}>
                        SSI Node Info
                    </h2>
                    <br />
                    <DidInfo></DidInfo>
                </Box>
            </Grid>
            {nodeType == "PLANT" && <Grid item xs={12} >
                <Box border={2}  {...boxProps} >
                    <h2 style={{ margin: 8 }}>
                         Ethereum Node Info
                    </h2>
                    <br />
                    <EthInfo></EthInfo>
                </Box>
            </Grid>}
            <Grid item xs={12} >
                <Box border={2}  {...boxProps} >
                    <h2 style={{ margin: 8 }}>
                        Connections
                    </h2>
                    <br />
                    <Connection ></Connection>
                </Box>
            </Grid>
            {nodeType == "TUEV" && < Grid item xs={12} >
                <Box border={2}  {...boxProps} >
                <h2 style={{margin: 8}}>
                Credential Creation
                </h2>
                <br />
                    <CredentialCreation></CredentialCreation>
                </Box>
                </Grid>
            }
            {
                (nodeType == "TUEV" || nodeType == "PLANT") &&  <Grid item xs={12} >
                <Box border={2}  {...boxProps} >
                    <h2 style={{ margin: 8 }}>
                        Credential Issue
                    </h2>
                    <br />
                    <CredentialIssue></CredentialIssue>

                </Box>
            </Grid>
            }
            {
                (nodeType == "TUEV" || nodeType == "GARANTIEGEBER") &&
                <Grid item xs={12} >
                    <Box border={2}  {...boxProps} >
                        <h2 style={{ margin: 8 }}>
                            Credential Presentation
                        </h2>
                        <br />
                        <CredentialPresentation></CredentialPresentation>
                    </Box>
                </Grid>
            }
            {
                (nodeType == "TUEV" || nodeType == "PLANT" || nodeType == "GARANTIEGEBER"|| nodeType == "OWNER") &&
                <Grid item xs={12}>
                    <Box border={2}  {...boxProps} >
                        <h2 style={{margin: 8}}>
                            Messaging
                        </h2>
                        <br/>
                        <Messages></Messages>

                    </Box>
                </Grid>
            }
            {
                ( nodeType === "OWNER" || nodeType == "PLANT") &&
                <Grid item xs={12}>
                    <Box border={2}  {...boxProps} >
                        <h2 style={{margin: 8}}>
                            Claim Guarantee for Asset
                        </h2>
                        <br/>
                        <Claim></Claim>

                    </Box>
                </Grid>
            }
            {
                ( nodeType == "GARANTIEGEBER") &&
                <Grid item xs={12}>
                    <Box border={2}  {...boxProps} >
                        <h2 style={{margin: 8}}>
                            Received Claims
                        </h2>
                        <br/>
                        <ClaimReceipt></ClaimReceipt>

                    </Box>
                </Grid>
            }
        </Grid>
    </div>
  );
}

export {App, nodeType, nodeConf};
