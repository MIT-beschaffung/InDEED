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
import icons, {other_pics} from "../assets/icons";

interface IState {
    connection_id: string ;
    cred_def_id: string;
    presentations: any[] ;
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true};

class CredentialPresentation extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
        super(props);
        this.state = {
            connection_id: "",
            cred_def_id: "",
            presentations: [],

        }
        this.socketListen();
        socket.emit("get_presentations",null,(res) =>{
            MyLogger.debug(res);
            if(res.success){
                const presentations = res.payload;
                this.setState({
                    presentations: presentations
                })
                this.props.enqueueSnackbar("Presentation loaded", { variant: 'success',  ...SnackbarOptions });
            }
            else{
                this.props.enqueueSnackbar("Presentation Load Error", { variant: 'success',  ...SnackbarOptions });
            }

        })


    }private socketListen(){

        socket.on("presentation_finished", (presentation: any) => {
            try{
                MyLogger.debug(presentation);
                this.setState(
                    {
                        presentations: this.state.presentations.concat(presentation)
                    }
                );
                if(presentation.state =="presentation_acked")
                    this.props.enqueueSnackbar("Presentation acked", { variant: 'success',  ...SnackbarOptions });
                else if(presentation.state =="presentation_verfied"){
                    if(presentation.verified == "true")
                        this.props.enqueueSnackbar("Presentation verified", { variant: 'success',  ...SnackbarOptions });
                    else{
                        this.props.enqueueSnackbar("Presentation not verified", { variant: 'error',  ...SnackbarOptions });
                    }
                }

            }
            catch (e) {
                MyLogger.debug(e)
                this.props.enqueueSnackbar("Presentation Format Error", { variant: 'error',  ...SnackbarOptions });
            }

        });
    }



    render(){
        return(
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box border={2}
                             {...boxProps}>
                            <Typography variant="h6">Presentations</Typography>
                            {
                                this.state.presentations.map((el) => {
                                    MyLogger.debug(el)
                                    return(
                                        <Box
                                            key = {el["presentation_exchange_id"]}
                                            width="auto"
                                            alignItems="center"
                                            display="flex"
                                            style={{ padding: 2 }}
                                        >

                                            {el.verified == "true" &&<img src={other_pics.verified} height="50px"/> }
                                            {el.verified != "true" &&<img src={other_pics.denied} height="50px"/> }
                                            &nbsp;
                                            <img src={icons.PLANT} height="50px"/>
                                            &nbsp;&nbsp;
                                            ConnectionID: {el["connection_id"]}<br />&nbsp;&nbsp;
                                            PresentationID: {el["presentation_exchange_id"]}<br />&nbsp;&nbsp;
                                            CredDefID: {el["presentation"]["identifiers"][0]["cred_def_id"]}<br />
                                        </Box>
                                    );
                                })
                            }
                        </Box>
                    </Grid>


                        <Grid item xs={12}>
                            <Card >
                                <CardContent>
                                    <Typography variant="h5">Request Certificate Presentation</Typography>
                                    <br />

                                    <TextField
                                        id="presentation_credential"
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
                                        id="presentation_credential_def"
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
                                    <Button variant="contained"
                                            color="primary"
                                            style={{ margin: 8 }}
                                            onClick={() => {
                                                if(this.state.cred_def_id == "" || this.state.connection_id == ""  ){
                                                    this.props.enqueueSnackbar("Invald Data Input", { variant: 'error' ,...SnackbarOptions });
                                                    return;
                                                }
                                                socket.emit("credential_presentation_request", {
                                                    "connection_id": this.state.connection_id,
                                                    "cred_def_id": this.state.cred_def_id
                                                } ,(resp) =>{
                                                    const data = resp.payload;
                                                    if(resp.success){
                                                        this.props.enqueueSnackbar("Credential Presentation requested", { variant: 'success' ,...SnackbarOptions });
                                                    }
                                                    else{
                                                        this.props.enqueueSnackbar("Credential Presentation Request Error", { variant: 'error', ...SnackbarOptions });
                                                    }
                                                });
                                            }}
                                    >Request Presentation</Button>
                                </CardContent>
                            </Card>
                        </Grid>


                    </Grid>



            </div>
        )
    }
}

export default withSnackbar(CredentialPresentation);
