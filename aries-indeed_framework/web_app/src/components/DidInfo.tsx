import React, {Component} from "react";
import {Button, Input} from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import {nodeType, socket} from "../service/socket";
import Select from '@material-ui/core/Select';
import { withSnackbar } from 'notistack';
import icons from "../assets/icons";
const node_conf = require("../node_config.json");

interface IState {
   didInfo: string,
    did: string,
    register_nym_text : string
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true};

class DidInfo extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
        super(props);
        this.state = {
            didInfo: "",
            did: "",
            register_nym_text: ""
        }
        this.socketListen();
        socket.emit("get_didinfo", null, (ans)=>{
           if(ans.success){

               try{

                   this.setState({
                       didInfo : JSON.stringify(ans.payload,  null, 2),
                       did: ans.payload.did
                   })
                   this.props.enqueueSnackbar("Got DID Info", { variant: 'success', ...SnackbarOptions });
               }
               catch (e) {
                   this.props.enqueueSnackbar("DID Info Format Error", { variant: 'error', ...SnackbarOptions });
               }

           }
           else{
               this.props.enqueueSnackbar("Couldnt get DID Info", { variant: 'error', ...SnackbarOptions });

           }
        })
    }
    private socketListen(){

        socket.on("new_didinfo", (didInfo: any) => {
            try{
                this.setState({didInfo: didInfo, did: didInfo["did"]});
            }catch (e) {
                console.error(e);
            }
        });
    }


    render(){
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <Box  border={2}
                              {...boxProps} >
                            <Typography variant="h6">Did Info: {this.state.did}</Typography>
                            <br /><br />
                            {
                               this.state.didInfo
                            }
                        </Box>


                    </Grid>

                    <Grid item xs={6}>
                        <Card>{

                                 nodeType == "BNA" &&
                                        <CardContent>
                                            <Typography variant="h5">Register other DIDs on Ledger</Typography>
                                            <br />
                                            <TextField
                                                id="register_nym_textfield"
                                                placeholder="Did Info"
                                                variant="outlined"
                                                onChange = {
                                                    (e) => {
                                                        this.setState({
                                                            register_nym_text: e.target.value,
                                                        })
                                                    }
                                                }
                                                multiline

                                                fullWidth
                                                style={{ margin: 8 }}
                                            />
                                            <br />
                                            <Button variant="contained" color="primary" style={{ margin: 8 }} onClick={
                                                ()=> {
                                                    MyLogger.debug(this.state.register_nym_text);
                                                    socket.emit("register_nym", this.state.register_nym_text, (resp) =>{
                                                        if(resp.success) {
                                                            this.props.enqueueSnackbar("Registration on Ledger successful", { variant: 'success', ...SnackbarOptions });
                                                        }
                                                        else{
                                                            this.props.enqueueSnackbar("Registration Error", { variant: 'error', ...SnackbarOptions });
                                                        }
                                                    });
                                                }
                                            }>Submit</Button>
                                        </CardContent>

                                }


                                { nodeType !== "BNA" &&
                                    <CardContent>
                                            <Typography variant="h5">Make DID Public after Registration </Typography>
                                            <br />
                                            <Button variant="contained" color="primary" style={{ margin: 8 }} onClick={
                                                ()=> {
                                                    socket.emit("make_did_public", this.state.did, (resp) =>{
                                                        if(resp.success == true) {
                                                            this.props.enqueueSnackbar("DID now public", { variant: 'success', ...SnackbarOptions });
                                                            this.setState({
                                                                didInfo: JSON.stringify(resp.payload, null, 2)
                                                            })
                                                        }
                                                        else{
                                                            this.props.enqueueSnackbar("DID public error", { variant: 'error', ...SnackbarOptions });
                                                        }
                                                    });
                                                }
                                            }>Make public</Button>
                                        </CardContent>


                            }


                        </Card>
                    </Grid>
                </Grid>


            </div>
        )
    }
}

export default withSnackbar(DidInfo);
