import React from "react";
import {Form} from "react-bootstrap";
import PropTypes from "prop-types";

const CreateForm = (props) => {
    return (
        <Form id={'create-form'} onSubmit={props.onSubmit} style={props.style}>
            <Form.Group controlId={'username'}>
                <Form.Label>Username</Form.Label>
                <Form.Control required type={'text'} placeholder={'Username eingeben'}/>
            </Form.Group>
            <Form.Group controlId={'password'}>
                <Form.Label>Passwort</Form.Label>
                <Form.Control required type={'password'} placeholder={'Passwort'}/>
            </Form.Group>
            <Form.Group controlId={'password_check'}>
                <Form.Label>Passwort wiederholen</Form.Label>
                <Form.Control required type={'password'} placeholder={'Passwort wiederholen'}/>
            </Form.Group>
            <Form.Group controlId={'url'}>
                <Form.Label>Homepage-URL</Form.Label>
                <Form.Control required type={'url'} placeholder={'URL'}/>
            </Form.Group>
            <Form.Check type={'checkbox'} id={'role'} label={'Adminrechte gewähren'}/>
        </Form>
    );
}

CreateForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    style: PropTypes.object
}

export default CreateForm;