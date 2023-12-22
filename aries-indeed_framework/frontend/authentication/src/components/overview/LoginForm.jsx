import React from "react";
import PropTypes from 'prop-types';
import {Form} from "react-bootstrap";

const LoginForm = (props) => {
    return (
        <Form id={'login-form'} onSubmit={props.onSubmit}>
            <Form.Group controlId={'username'}>
                <Form.Label>Username</Form.Label>
                <Form.Control required type={'text'} placeholder={'Username eingeben'}/>
            </Form.Group>
            <Form.Group controlId={'password'}>
                <Form.Label>Passwort</Form.Label>
                <Form.Control required type={'password'} placeholder={'Passwort'}/>
            </Form.Group>
        </Form>
    );
}

LoginForm.propTypes = {
    onSubmit: PropTypes.func.isRequired
}

export default LoginForm;