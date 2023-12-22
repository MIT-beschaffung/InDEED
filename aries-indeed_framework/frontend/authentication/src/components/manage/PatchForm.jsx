import React from "react";
import {Form} from "react-bootstrap";
import PropTypes from "prop-types";

const PatchForm = (props) => {
    return (
        <Form id={'patch-form'} onSubmit={props.onSubmit} style={props.style}>
            <Form.Group controlId={'username'}>
                <Form.Label>Username</Form.Label>
                <Form.Control type={'text'} placeholder={props.user.name}/>
            </Form.Group>
            <Form.Group controlId={'password'}>
                <Form.Label>Passwort</Form.Label>
                <Form.Control type={'password'} placeholder={'Neues Passwort'} disabled/>
            </Form.Group>
            <Form.Group controlId={'url'}>
                <Form.Label>Homepage-URL</Form.Label>
                <Form.Control type={'url'} placeholder={typeof props.user.url === 'string' ? props.user.url : props.user.url.href}/>
            </Form.Group>
            <Form.Check type={'checkbox'} id={'reset'} label={'Passwort zurücksetzten'}
                        onClick={() => {
                            if (document.getElementById('reset').checked)
                                document.getElementById('password').removeAttribute("disabled")
                            else {
                                document.getElementById('password').setAttribute("disabled", "true")
                                document.getElementById('password').value = ""
                            }
                        }} />
            <Form.Check type={'checkbox'} id={'role'} label={'Adminrechte gewähren'} defaultChecked={props.user.roles.includes("ADMIN")}/>
        </Form>
    );
}

PatchForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    style: PropTypes.object
}

export default PatchForm;