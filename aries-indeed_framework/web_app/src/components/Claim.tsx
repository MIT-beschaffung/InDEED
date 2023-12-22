import React, { Component, ElementType } from "react";
import { Button, Input } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import TextField from '@material-ui/core/TextField';
import { nodeType, socket } from "../service/socket";
import { withSnackbar } from 'notistack';
import Divider from '@material-ui/core/Divider';
import icons, { other_pics } from "../assets/icons";
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';
import MailIcon from '@material-ui/icons/Mail';
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';
import SvgIcon from '@material-ui/core/SvgIcon';
import { withStyles } from '@material-ui/core/styles';
import AssignmentReturnIcon from '@material-ui/icons/AssignmentReturn';

interface IState {
    asset_did: string;
    claims: any[];
    connection_id: string;
    timestamp: string;
    claimView: any[];
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true
};

const styles = {
    claimPrimary: {
        color: 'black',
    }
}

let statusIcons = new Map<string, any>([
    ["sent", <MailIcon />],
    ["accepted", <DoneIcon />],
    ["request_data", <AssignmentReturnIcon />]
]
)

class Claim extends Component<any, IState> {
    s: SocketIOClient.Socket = socket;

    constructor(props: any) {
        super(props);
        this.state = {
            asset_did: "",
            claims: [],
            connection_id: "",
            timestamp: "",
            claimView: [],
        }
        this.socketListen();
        //--> Alle Claims, die bisher schon gesendet wurden und im backend gespeichert, werden geladen
        socket.emit("get_claims", null, (res) => {

            if (res.success) {
                //
                const claims = res.payload;

                this.setState({
                    claims: claims
                })
                this.props.enqueueSnackbar("Claims loaded", { variant: 'success', ...SnackbarOptions });
            }
            else {
                this.props.enqueueSnackbar("Claims Load Error", { variant: 'error', ...SnackbarOptions });
            }

        })
    }

    private socketListen() {
        //nach verarbeitung von webhook, in Frontend
        socket.on("new_claim", (claim: any) => {

            try {
                const connectionId = claim["connection_id"]
                const index = this.state.claims.findIndex(e => e["connection_id"] == connectionId);
                if (index == -1) {
                    MyLogger.debug(this.state.claims.concat(claim).concat(claim))
                    this.setState(
                        {
                            claims: this.state.claims.concat(claim)
                        }
                    );
                    //this.props.enqueueSnackbar("New Chat, new Message", { variant: 'success',  ...SnackbarOptions });

                }
                else {
                    const c = this.state.claims;
                    c[index].claims = claim.claims;

                    this.setState(
                        {
                            claims: c
                        }
                    );
                    this.props.enqueueSnackbar("New Claim", { variant: 'success', ...SnackbarOptions });

                }
                this.changeClaimView();

            }
            catch (e) {
                MyLogger.debug(e)
                this.props.enqueueSnackbar("Claims Format Error", { variant: 'error', ...SnackbarOptions });
            }
            MyLogger.debug(this.state.claims);

        });
    }

    changeClaimView(connectionID: string = this.state.connection_id) {
        //Index von element, bei welcher Connection ID übereinstimmen
        const cvIndex = this.state.claims.findIndex(el => connectionID == el["connection_id"]);
        var cv;
        MyLogger.debug(cvIndex)
        if (cvIndex == -1) {
            cv = [];
        }
        else {
            cv = this.state.claims[cvIndex]["claims"];
            MyLogger.debug('cv');
            MyLogger.debug(cv)
        }
        this.setState({
            claimView: cv
        })
    }

    render() {
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12} style={{ display: "inline-grid" }}>
                        <TextField
                            id="connection_id"
                            placeholder="ConnectionID with Insurer"
                            variant="outlined"
                            onChange={
                                (e) => {
                                    this.setState({
                                        connection_id: e.target.value,
                                    })
                                    this.changeClaimView(e.target.value);
                                }
                            }
                            multiline
                            fullWidth
                            style={{ backgroundColor: "white" }}
                        />
                    </Grid>

                    <Grid item xs={12} style={{ display: "inline-grid" }}>
                        <Box>
                            <TextField
                                id="asset_did"
                                placeholder="Asset DID"
                                variant="outlined"
                                value={this.state.asset_did}
                                onChange={
                                    (e) => {
                                        this.setState({
                                            asset_did: e.target.value,
                                        })
                                    }
                                }
                                multiline
                                fullWidth
                                style={{ backgroundColor: "white" }}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={11}>
                        <TextField
                            id="timestamp"
                            placeholder="Timestamp"
                            variant="outlined"
                            value={this.state.timestamp}
                            onChange={
                                (e) => {
                                    this.setState({
                                        timestamp: e.target.value,
                                    })
                                }
                            }
                            multiline
                            fullWidth
                            style={{ backgroundColor: "white" }}
                        />
                    </Grid>
                    <Grid item xs={1}>
                        <div>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                style={{ margin: 4 }}
                                onClick={() => {
                                    if (this.state.asset_did == "" || this.state.connection_id == "") {
                                        this.props.enqueueSnackbar("No valid input", { variant: 'error', ...SnackbarOptions });
                                        return;
                                    }
                                    socket.emit("send_claim", {
                                        "asset_did": this.state.asset_did,
                                        "connection_id": this.state.connection_id,
                                        "timestamp": this.state.timestamp
                                    }, (resp) => {
                                        if (resp.success) {
                                            this.setState({
                                                asset_did: "",
                                                timestamp: "",
                                            });

                                        }
                                        else {
                                            this.props.enqueueSnackbar("Message Send Error", { variant: 'error', ...SnackbarOptions });
                                        }
                                    });
                                }}>Claim now</Button>
                        </div>
                    </Grid>
                </Grid>

                <List>

                    {

                        //Alle Elemente aus Chatview werden auf ein HTML Element gemapped.
                        this.state.claimView.map((el) => {

                            return (
                                <div style={{ backgroundColor: "white" }}>
                                    <Grid container>
                                        <Grid item xs={10}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        {statusIcons.get(el.state)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText classes={{ primary: this.props.classes.claimPrimary }} primary={"Asset DID: " + el.content.assetDid} secondary={el.content.timestamp} />
                                            </ListItem>
                                        </Grid>
                                        <Grid item xs={2} alignItems="center" justify="center" style={{ display: "flex" }}>
                                            {
                                                (el.state === "request_data") &&
                                                (
                                                    <div>
                                                        <IconButton onClick={() => { }}><DoneIcon style={{ color: "green" }} />
                                                        </IconButton>
                                                        <IconButton onClick={() => { }}><ClearIcon style={{ color: "red" }} />
                                                        </IconButton>
                                                    </div>
                                                )


                                            }

                                        </Grid>

                                    </Grid>
                                    <Divider variant="middle" />
                                </div>
                            );
                        })
                    }
                </List>


            </div>
        )
    }
}

export default withStyles(styles)(withSnackbar(Claim));