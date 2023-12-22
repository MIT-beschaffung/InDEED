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
    schemaID: string,
    credDefID: string
}


const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000};

class CredentialCreation extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
        super(props);
        this.state = {
            schemaID: "",
            credDefID: ""

        }

    }

    render(){
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <Box  border={2}
                              {...boxProps}>
                            <b>SchemaID: </b> <br />{this.state.schemaID}
                            <br /><br />
                            <b>CredentialDefID: </b><br />{this.state.credDefID}
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Card >
                            <CardContent>
                                <Typography variant="h5">Create Schema + Credential Definition</Typography>
                                <br />
                                <Button variant="contained"
                                        color="primary"
                                        style={{ margin: 8 }}
                                        onClick={() => {
                                            MyLogger.debug("Create Schema+ Definition");
                                            socket.emit("create_schema_def", null ,(resp) =>{
                                                MyLogger.debug(resp.payload);
                                                const data = resp.payload;
                                                if(resp.success){

                                                    this.setState(
                                                        {
                                                            schemaID: data.schemaID,
                                                            credDefID: data.credDefID
                                                        }
                                                    );
                                                    this.props.enqueueSnackbar("New Schema + Credential Definition", { variant: 'success' ,...SnackbarOptions });
                                                }
                                                else{
                                                    this.props.enqueueSnackbar("Error Schema + Credential Definition", { variant: 'error', ...SnackbarOptions });
                                                }
                                            });
                                        }}
                                >Create</Button>
                            </CardContent>
                        </Card>


                    </Grid>

                </Grid>


            </div>
        )
    }
}

export default withSnackbar(CredentialCreation);
