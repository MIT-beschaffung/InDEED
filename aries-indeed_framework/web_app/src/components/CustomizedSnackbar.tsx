import React from 'react';

import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { makeStyles, Theme } from '@material-ui/core/styles';

function Alert(props: AlertProps) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        width: '100%',
        '& > * + *': {
            marginTop: theme.spacing(2),
        },
    },
}));
interface IProps {

}
interface IState {

    message: string;
    open: boolean;
    severity: "success" | "info" | "warning" | "error" | undefined
}

export class CustomizedSnackbars extends React.Component <IProps, IState>{
    constructor(props: IProps) {
        super(props);
        this.state  = {

            message: "",
            open: false,
            severity: "success"
        };
    }


    open (severty: "success" | "info" | "warning" | "error" | undefined , message: string) {
        this.setState({
            open: true,
            severity: severty,
            message: message

        })
    };

    handleClose (event?: React.SyntheticEvent, reason?: string) {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({
            open: false,
        })
    };
    render(){
        return (
            <div >
                <Snackbar
                    message={this.state.message}
                    open={this.state.open}
                    onClose={() => this.setState({ open: false })}
                    autoHideDuration={2000}
                >
                    <Alert  severity={this.state.severity}>
                        {this.state.message}
                    </Alert>
                </Snackbar>

            </div>
        );
    }

}
