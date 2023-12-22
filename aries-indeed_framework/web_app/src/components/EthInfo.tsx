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
    ethInfo: string,
    ethKey: string
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true};

class EthInfo extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
        super(props);
        this.state = {
            ethInfo: "",
            ethKey: ""

        }
        this.socketListen();
        socket.emit("get_ethinfo", null, (ans)=>{
            if(ans.success){

                try{
                    this.setState({
                        ethInfo : JSON.stringify(ans.payload,  null, 2),
                        ethKey : ans.payload
                    });
                    this.props.enqueueSnackbar("Got Eth Info", { variant: 'success', ...SnackbarOptions });
                }
                catch (e) {
                    this.props.enqueueSnackbar("Eth Info Format Error", { variant: 'error', ...SnackbarOptions });
                }

            }
            else{
                this.props.enqueueSnackbar("Couldnt get ETh Info", { variant: 'error', ...SnackbarOptions });

            }
        })
    }
    private socketListen(){

        socket.on("new_ethinfo", (ethInfo: any) => {
            try{
                this.setState({ethInfo: ethInfo, ethKey: ethInfo});
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
                        <Box  
                              {...boxProps}>
                            <Typography variant="h6">Eth Key Info: {this.state.ethKey}</Typography>

                        </Box>


                    </Grid>
                </Grid>


            </div>
        )
    }
}

export default withSnackbar(EthInfo);
