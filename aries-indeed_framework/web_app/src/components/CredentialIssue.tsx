import React, {Component} from "react";
import {Button, Input} from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import {nodeType, socket} from "../service/socket";
import { withSnackbar } from 'notistack';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import icons, {other_pics} from "../assets/icons";
const node_conf = require("../node_config.json");
interface IState {
    cred_params: string;
    connection_id: string ;
    cred_def_id: string;
    credentials: any[] ;
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true};

class CredentialIssue extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
        super(props);
        this.state = {
            cred_params: "",
            connection_id: "",
            cred_def_id: "",
            credentials: [],

        }
        this.socketListen();

        if(nodeType == "PLANT"){
            socket.emit("get_credentials", null,(res) =>{
                MyLogger.debug(res);
                if(res.success){
                    const credentials = res.payload;
                    this.setState({
                        credentials: credentials
                    })
                    this.props.enqueueSnackbar("Credentials loaded", { variant: 'success',  ...SnackbarOptions });
                }
                else{
                    this.props.enqueueSnackbar("Credentials Load Error", { variant: 'success',  ...SnackbarOptions });
                }

            })
        }
    }
    private socketListen(){

        socket.on("new_credential", (credential: any) => {
           try{
               this.setState(
                        {
                            credentials: this.state.credentials.concat(credential)
                        }
                    );
                    this.props.enqueueSnackbar("Credential acked", { variant: 'success',  ...SnackbarOptions });
                }
                catch (e) {
                    MyLogger.debug(e)
                    this.props.enqueueSnackbar("Credential Format Error", { variant: 'error',  ...SnackbarOptions });
                }

        });
    }



    render(){
        return(
            <div>
                {nodeType == "PLANT" && <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box border={2}
                             {...boxProps}>
                            <Typography variant="h6">Credentials</Typography>
                            {
                                this.state.credentials.map((el) => {
                                    return(
                                        <Box
                                            key = {el["credential_id"]}
                                            width="auto"
                                            alignItems="center"
                                            display="flex"
                                            style={{ padding: 2 }}
                                        >
                                            <img src={other_pics.credential} height="50px"/>
                                            &nbsp;&nbsp;State: {el["state"]}<br /> &nbsp;&nbsp;CredentialID: {el["credential_id"]}<br /> &nbsp;&nbsp;CredDefID: {el["credential_definition_id"]}
                                        </Box>
                                    );
                                })
                            }
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box border={2}
                             {...boxProps}>
                            <Typography variant="h6">Credential Parameter: </Typography>
                            {this.state.cred_params}
                        </Box>

                    </Grid>
                    <Grid item xs={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5">Make Credential Parameters</Typography>
                                <br/>
                                <Button variant="contained"
                                        color="primary"
                                        style={{margin: 8}}
                                        onClick={() => {
                                            socket.emit("make_cred_params", null, (resp) => {
                                                const data = resp.payload;
                                                MyLogger.debug(data);
                                                if (resp.success) {
                                                    this.setState(
                                                        {
                                                            cred_params: JSON.stringify(data, null, 2)

                                                        }
                                                    );
                                                    this.props.enqueueSnackbar("New Credential Parameters", {variant: 'success', ...SnackbarOptions});
                                                } else {
                                                    this.props.enqueueSnackbar("Credential Parameter Error", {variant: 'error', ...SnackbarOptions});
                                                }
                                            });
                                        }}
                                >Create</Button>
                            </CardContent>
                        </Card>
                    </Grid>


                </Grid>
                }
                {
                    nodeType == "TUEV" && <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card >
                                <CardContent>
                                    <Typography variant="h5">Issue Credential with Parameters</Typography>
                                    <br />
                                    {/*<Select
                                        value={age}
                                        onChange={handleChange}
                                        label="ConnectionID"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={10}>Ten</MenuItem>
                                        <MenuItem value={20}>Twenty</MenuItem>
                                        <MenuItem value={30}>Thirty</MenuItem>
                                    </Select> */}
                                    <TextField
                                        id="issue_credential_connection"
                                        placeholder="Connection ID"
                                        variant="outlined"
                                        onChange = {
                                            (e) => {
                                                this.setState({
                                                    connection_id: e.target.value,
                                                })
                                            }
                                        }
                                        multiline
                                        fullWidth
                                        style={{ margin: 8 }}
                                    />
                                    <br />
                                    <TextField
                                        id="issue_credential_def"
                                        placeholder="Credential Definition ID"
                                        variant="outlined"
                                        onChange = {
                                            (e) => {
                                                this.setState({
                                                    cred_def_id: e.target.value,
                                                })
                                            }
                                        }
                                        multiline
                                        fullWidth
                                        style={{ margin: 8 }}
                                    />
                                    <br />
                                    <TextField
                                        id="issue_credential_params"
                                        placeholder="Credential Parameters"
                                        variant="outlined"
                                        onChange = {
                                            (e) => {
                                                this.setState({
                                                    cred_params: e.target.value,
                                                })
                                            }
                                        }
                                        multiline

                                        fullWidth
                                        style={{ margin: 8 }}
                                    />
                                    <br />
                                    <Button variant="contained"
                                            color="primary"
                                            style={{ margin: 8 }}
                                            onClick={() => {
                                                if(this.state.cred_def_id == "" || this.state.connection_id == "" || this.state.cred_params == "" ){
                                                    this.props.enqueueSnackbar("Invald Data Input", { variant: 'error' ,...SnackbarOptions });
                                                    return;
                                                }
                                                socket.emit("issue_credential", {
                                                    "cred_params": this.state.cred_params,
                                                    "connection_id": this.state.connection_id,
                                                    "cred_def_id": this.state.cred_def_id
                                                } ,(resp) =>{
                                                    const data = resp.payload;
                                                    MyLogger.debug(data);
                                                    if(resp.success){
                                                        this.setState(
                                                            {
                                                                cred_params: JSON.stringify(data, null ,2)

                                                            }
                                                        );
                                                        this.props.enqueueSnackbar("Credential issued to Plant", { variant: 'success' ,...SnackbarOptions });
                                                    }
                                                    else{
                                                        this.props.enqueueSnackbar("Credential Issue Error", { variant: 'error', ...SnackbarOptions });
                                                    }
                                                });
                                            }}
                                    >Issue</Button>
                                </CardContent>
                            </Card>
                        </Grid>


                    </Grid>

                    }



        </div>
        )
    }
}

export default withSnackbar(CredentialIssue);
