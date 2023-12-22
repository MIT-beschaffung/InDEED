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
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';

interface IState {
    message_input: string;
    messages: any[] ;
    connection_id: string;
    chat_view : any[];
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true};

class Messages extends Component<any, IState> {
    s:  SocketIOClient.Socket = socket ;

    constructor(props: any) {
        super(props);
        this.state = {
            message_input: "",
            messages: [],
            connection_id: "",
            chat_view : []
        }
        this.socketListen();
        //--> Alle Messages, die bisher schon gesendet wurden und im backend gespeichert, werden geladen
        socket.emit("get_messages",null,(res) =>{

            if(res.success){
                //
                const messages = res.payload;

                this.setState({
                    messages: messages
                })
                this.props.enqueueSnackbar("Messages loaded", { variant: 'success',  ...SnackbarOptions });
            }
            else{
                this.props.enqueueSnackbar("Messages Load Error", { variant: 'error',  ...SnackbarOptions });
            }

        })


    }
    private socketListen(){

        //nach verarbeitung von webhook, in Frontend
        socket.on("new_message", (chat: any) => {

            try{
                const connectionID = chat["connection_id"]
                const index  = this.state.messages.findIndex(e => e["connection_id"] == connectionID);
                if(index == -1){
                    MyLogger.debug(this.state.messages.concat(chat).concat(chat))
                    this.setState(
                        {
                            messages: this.state.messages.concat(chat)
                        }
                    );
                    //this.props.enqueueSnackbar("New Chat, new Message", { variant: 'success',  ...SnackbarOptions });

                }
                else{
                    const m = this.state.messages;
                    m[index].messages = chat.messages;

                    this.setState(
                        {
                            messages:m
                        }
                    );
                    this.props.enqueueSnackbar("New Message", { variant: 'success',  ...SnackbarOptions });

                }
                this.changeChatView();

            }
            catch (e) {
                MyLogger.debug(e)
                this.props.enqueueSnackbar("Messages Format Error", { variant: 'error',  ...SnackbarOptions });
            }
            MyLogger.debug(this.state.messages) ;

        });
    }
    //Ordnung mehrerer Chats entsprechend der Connection ID
    changeChatView(connectionID: string = this.state.connection_id){
        //Index von element, bei welcher Connection ID übereinstimmen
        const cv_index = this.state.messages.findIndex(el => connectionID == el["connection_id"]);
        var cv;
        MyLogger.debug(cv_index)
        if (cv_index == -1){
            cv = [];
        }
        else{
            cv = this.state.messages[cv_index]["messages"];
        }
        this.setState({
            chat_view: cv
        })
    }


    render(){
        return(
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12} style={{display: "inline-grid"}}>
                        <TextField
                            id="connection_message"
                            placeholder="ConnectionID"
                            variant="outlined"
                            onChange = {
                                (e) => {

                                    this.setState({
                                        connection_id: e.target.value,

                                    })

                                    this.changeChatView(e.target.value);
                                }
                            }
                            multiline
                            fullWidth
                            style={{backgroundColor: "white"}}
                        />
                            {
                                //Alle Elemente aus Chatview werden auf ein HTML Element gemapped.
                                this.state.chat_view.map((el) => {

                                        return(
                                            <div style={{width: "100%"}}>
                                            <Box
                                                width="auto"
                                                border={2}
                                                {...boxProps}
                                                alignItems="left"
                                                display="flex"
                                                style={{ padding: 5, margin: 5, display: "inline-block", float: el.state == "send"? "right": "left" }}
                                            >
                                                {el["content"]}
                                            </Box>
                                            </div>
                                        );
                                })





                            }
                    </Grid>



                        <Grid item xs={11}>
                            <Box>
                                <TextField
                                    id="message_text"
                                    placeholder="Message"
                                    variant="outlined"
                                    value = {this.state.message_input}
                                    onChange = {
                                        (e) => {
                                            this.setState({
                                                message_input: e.target.value,
                                            })
                                        }
                                    }
                                    multiline
                                    fullWidth
                                    style={{backgroundColor: "white"}}
                                />
                            </Box>

                        </Grid>
                        <Grid item xs={1}>
                            <IconButton
                                    color="primary"
                                    onClick={() => {
                                        if(this.state.message_input == "" || this.state.connection_id == ""  ){
                                            this.props.enqueueSnackbar("No valid input", { variant: 'error' ,...SnackbarOptions });
                                            return;
                                        }
                                        socket.emit("send_message", {
                                            "message": this.state.message_input,
                                            "connection_id": this.state.connection_id
                                        } ,(resp) =>{
                                            if(resp.success){
                                                this.setState({
                                                    message_input: ""
                                                });

                                               }
                                            else{
                                                this.props.enqueueSnackbar("Message Send Error", { variant: 'error', ...SnackbarOptions });
                                            }
                                        });
                                    }}
                            ><SendIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
            </div>
        )
    }
}

export default withSnackbar(Messages);
