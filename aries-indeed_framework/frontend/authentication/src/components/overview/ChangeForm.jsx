import React from "react";
import PropTypes from "prop-types";
import {Form} from "react-bootstrap";

const ChangeForm = (props) => {
    return(
        <Form id={'change-form'} onSubmit={props.onSubmit} className={'form-wrapper'}>
            <Form.Group controlId={'old_password'}>
                <Form.Label>Altes Passwort</Form.Label>
                <Form.Control required type={'password'} placeholder={'Altes Passwort eingeben'}/>
            </Form.Group>
            <Form.Group controlId={'new_password'}>
                <Form.Label>Neues Passwort</Form.Label>
                <Form.Control required type={'password'} placeholder={'Neues Passwort eingeben'}/>
            </Form.Group>
            <Form.Group controlId={'new_password_check'}>
                <Form.Label>Neues Passwort wiederholen</Form.Label>
                <Form.Control required type={'password'} placeholder={'Neues Passwort wiederholen'}/>
            </Form.Group>
        </Form>
    );
}

ChangeForm.propTypes = {
    onSubmit: PropTypes.func.isRequired
}

export default ChangeForm;