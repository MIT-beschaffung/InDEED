import React, { Component } from "react";
import { Badge, Button, Input, Table } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import { nodeType, socket } from "../service/socket";
import { withSnackbar } from 'notistack';
import icons, { other_pics } from "../assets/icons";
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import MailIcon from '@material-ui/icons/Mail';
import DoneIcon from '@material-ui/icons/Done';
import Divider from '@material-ui/core/Divider';

import ListItemIcon from '@material-ui/core/ListItemIcon';

import Collapse from '@material-ui/core/Collapse';
import InboxIcon from '@material-ui/icons/Inbox';
import DraftsIcon from '@material-ui/icons/Drafts';

import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import AssignmentReturnIcon from '@material-ui/icons/AssignmentReturn';

interface IState {
    asset_did: string;
    claims: any[];
    connection_id: string;
    timestamp: string;
    open: boolean[];
}

const boxProps = {
    borderRadius: "borderRadius",
    style: { padding: 16 }
};

const styles = {
    claimPrimary: {
        color: 'black',
    },
    nested: {
        paddingLeft: 32,
    },
}

let statusIcons = new Map<string, any>([
    ["received", <MailIcon />],
    ["accepted", <DoneIcon />],
    ["request_data", <AssignmentReturnIcon />]
]
)

const SnackbarOptions = {
    autoHideDuration: 3000,
    preventDuplicate: true
};

class ClaimReceipt extends Component<any, IState> {
    s: SocketIOClient.Socket = socket;

    constructor(props: any) {
        super(props);
        this.state = {
            asset_did: "",
            claims: [],
            connection_id: "",
            timestamp: "",
            open: [],
        }
        //--> Alle Claims, die bisher schon gesendet wurden und im backend gespeichert, werden geladen
        socket.emit("get_claims", null, (res) => {
            MyLogger.debug('claims!!!')
            MyLogger.debug(res.payload)

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


        this.socketListen();
    }


    private handleClick(index: number) {
        let openNew = this.state.open;
        openNew[index] = !openNew[index];
        this.setState({ open: openNew });
    }

    private socketListen() {
        //nach verarbeitung von webhook, in Frontend
        socket.on("new_claim", (claim: any) => {
            MyLogger.debug('CLAIM')
            MyLogger.debug(claim)

            try {
                const connectionID = claim["connection_id"]
                const index = this.state.claims.findIndex(claim => claim["connection_id"] === connectionID);
                if (index === -1) {

                    this.setState(
                        {
                            claims: this.state.claims.concat(claim)
                        }
                    );

                }
                else {
                    const c = this.state.claims;
                    c[index].claims = claim.claims;

                    this.setState(
                        {
                            claims: c
                        }
                    );
                }
                this.props.enqueueSnackbar("New Claim", { variant: 'success', ...SnackbarOptions });

            }
            catch (e) {
                MyLogger.debug(e)
                this.props.enqueueSnackbar("Claim Format Error", { variant: 'error', ...SnackbarOptions });
            }

        });
    }

    render() {
        return (
            <div>
                {/* <Grid container spacing={3} align-items="center" justify="center"> */}
                {/* <Grid item xs={12} style={{ display: "inline-grid" }}> */}
                <List classes={{ root: this.props.classes.claimPrimary }}>
                    {

                        //Alle Elemente aus Chatview werden auf ein HTML Element gemapped.
                        this.state.claims.map((connection, index: number) => {
                            return (
                                <div style={{ backgroundColor: "white", marginBottom: "1em" }}>
                                    <ListItem button onClick={() => this.handleClick(index)}>
                                        <ListItemIcon>
                                            <Badge badgeContent={connection.claims.filter((claim) => claim.state === 'received').length} color="primary">
                                                <InboxIcon />
                                            </Badge>

                                        </ListItemIcon>
                                        <ListItemText primary={'Connection: ' + connection.connection_id} />
                                        {this.state.open[index] ? <ExpandLess /> : <ExpandMore />}
                                    </ListItem>
                                    <Collapse in={this.state.open[index]} timeout="auto" unmountOnExit>
                                        <List>
                                            {
                                                connection.claims.map((claim) => {
                                                    return (
                                                        <div style={{ backgroundColor: "white" }} >
                                                            <Grid container>
                                                                <Grid item xs={10}>
                                                                    <ListItem className={this.props.classes.nested}>
                                                                        <ListItemAvatar>
                                                                            <Avatar>
                                                                                {statusIcons.get(claim.state)}
                                                                            </Avatar>
                                                                        </ListItemAvatar>
                                                                        <ListItemText classes={{ primary: this.props.classes.claimPrimary }} primary={'Asset DID: ' + claim.content.assetDid} secondary={claim.content.timestamp} />
                                                                    </ListItem>

                                                                </Grid>
                                                                <Grid item xs={2} alignItems="center" justify="center" style={{ display: "flex" }}>
                                                                    {
                                                                        (claim.state === 'received') && (
                                                                            <Button variant="contained" color="primary" onClick={() => {
                                                                                socket.emit("update_claim", {
                                                                                    "asset_did": claim.content.assetDid,
                                                                                    "connection_id": connection.connection_id,
                                                                                    "state": "request_data",
                                                                                }, (resp) => {
                                                                                    if (resp.success) {
                                                                                    }
                                                                                    else {
                                                                                        this.props.enqueueSnackbar("Message Send Error", { variant: 'error', ...SnackbarOptions });
                                                                                    }
                                                                                });
                                                                            }}>Request data</Button>
                                                                        )
                                                                    }
                                                                    
                                                                </Grid>

                                                            </Grid>
                                                            <Divider variant="middle" />
                                                        </div>
                                                    );
                                                }
                                                )
                                            }
                                        </List>
                                    </Collapse>
                                </div>
                            )
                        }
                        )
                    }
                </List>
                {/* </Grid>
                </Grid> */}
            </div >
        )
    }
}

export default withStyles(styles)(withSnackbar(ClaimReceipt));
