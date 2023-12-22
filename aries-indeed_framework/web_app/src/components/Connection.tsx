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
import icons from "../assets/icons";
const node_conf = require("../node_config.json");
interface IState {
    created_invitations: any[];
    active_connections: any[];
    invitation_text_receive: string;

}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true};

class Connection extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
            super(props);
            this.state = {
                created_invitations: [],
                active_connections: [],
                invitation_text_receive: "",

            }
            this.socketListen();

            socket.emit("get_connections",null, (res)=>{
                MyLogger.debug(res);
                const connections = res["payload"]
                if( res.success){
                    try{
                        this.setState(
                            {
                                active_connections: connections
                            }
                        );
                        this.props.enqueueSnackbar("Connections loaded", { variant: 'success',  ...SnackbarOptions });
                    }
                    catch (e) {
                        this.props.enqueueSnackbar("Connection Load Error", { variant: 'error',  ...SnackbarOptions });
                    }

                }
        })
    }
    private socketListen(){

        socket.on("connection_process_finished", (connection: any) => {
            try{
                const state = connection["state"];
                if(state == "active" ){
                    try{
                        this.setState(
                            {
                                active_connections: this.state.active_connections.concat(connection)
                            }
                        );
                        this.props.enqueueSnackbar("Connection active", { variant: 'success',  ...SnackbarOptions });
                    }
                    catch (e) {
                        this.props.enqueueSnackbar("Connection id Error", { variant: 'error',  ...SnackbarOptions });
                    }

                }
                if(state == "inactive"){
                    this.props.enqueueSnackbar('Connection inactive', { variant: 'warning', ...SnackbarOptions })
                }
                if(state == "error"){
                    this.props.enqueueSnackbar('Connection error', {variant: 'error'})
                }
            }catch (e) {
              console.error(e);
            }
        });
    }


    render(){
            return (
                <div>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box  border={2}
                                  {...boxProps}>
                                <Typography variant="h6">Connections</Typography>
                                {
                                    this.state.active_connections.map(el =>{
                                        const node = node_conf.find( e => (e.name + "-Agent") == el["their_label"]);
                                        MyLogger.debug(el);
                                        return(
                                            <Box
                                                key = {el["connection_id"]}
                                                width="auto"
                                                alignItems="center"
                                                display="flex"
                                                style={{ padding: 2 }}
                                            >
                                                <img src={ node == null ? icons["BNA"]: icons[node.name]} height="50px"/> &nbsp;&nbsp;
                                                {el["state"]}: {el["connection_id"]}
                                            </Box>)
                                    })
                                }
                            </Box>


                        </Grid>
                        <Grid item xs={6}>
                            <Card >
                                <CardContent>
                                    <Typography variant="h5">Create Invitation</Typography>
                                    <br />
                                    <Button variant="contained"
                                            color="primary"
                                            style={{ margin: 8 }}
                                            onClick={() => {
                                                MyLogger.debug("Create Invitation");
                                                MyLogger.debug( this.state.created_invitations)
                                                socket.emit("create_invitation", null ,(resp) =>{

                                                    if(resp.success == true){
                                                        this.setState(
                                                            {
                                                                created_invitations : this.state.created_invitations.concat( JSON.stringify(resp.payload)),
                                                            }
                                                        );
                                                        this.props.enqueueSnackbar("New Invitation", { variant: 'success' ,...SnackbarOptions });
                                                    }
                                                    else{
                                                        this.props.enqueueSnackbar("Error Invitation creation", { variant: 'error', ...SnackbarOptions });
                                                    }
                                                });
                                            }}
                                    >Create</Button>
                                    {
                                        this.state.created_invitations.map(el =>
                                            <TextField value={el}
                                                       key={el}
                                                       label="Invitation"
                                                       multiline
                                                       variant="outlined"
                                                       fullWidth
                                                       style={{ margin: 8 }}
                                            > {el} </TextField>)
                                    }
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5">Receive Invitation</Typography>
                                    <br />
                                    <TextField
                                        id="receive_invitaion"
                                        placeholder="Invitation Field"
                                        variant="outlined"
                                        onChange = {
                                            (e) => {
                                                this.setState({
                                                    invitation_text_receive: e.target.value,
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
                                        MyLogger.debug(this.state.invitation_text_receive);
                                        socket.emit("invitation_received", this.state.invitation_text_receive, (resp) =>{
                                            if(resp.success == true) {
                                                this.props.enqueueSnackbar("Valid Invitation", { variant: 'success', ...SnackbarOptions });

                                            }
                                            else{
                                                this.props.enqueueSnackbar("No valid Invitation", { variant: 'error', ...SnackbarOptions });
                                            }
                                        });
                                    }
                                    }>Submit</Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>


                </div>
            )
        }
    }

export default withSnackbar(Connection);
