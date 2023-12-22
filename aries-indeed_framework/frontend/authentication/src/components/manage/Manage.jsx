import React, {useEffect, useState} from "react";
import PropTypes from "prop-types";
import {Button, Card, Modal} from "react-bootstrap";
import User from "./User";
import {getAllUser, putCreate, patchUser, deleteUserCall} from "../../services/loginService";
import CreateForm from "./CreateForm";

import "./modal.css";
import "./manage.css";
import PatchForm from "./PatchForm";

const WINDOW_SIZE = 10;

const UserManagement = (props) => {
    //TODO: filter search sort
    const [users, setUsers] = useState([
        {
            _id: "0-123-4",
            name: "Dummy",
            url: "https://auth.indeed-energy.de",
            roles: ['ADMIN']
        }
    ])
    const [currentUser, setCurrentUser] = useState({
            _id: "0-123-4",
            name: "Dummy",
            url: "https://auth.indeed-energy.de",
            roles: ['ADMIN']
        })
    const [window, setWindow] = useState(0)
    const [showCreate, setShowCreate] = useState(false)
    const [showPatch, setShowPatch] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [update, setUpdate] = useState(false)

    useEffect(() => {
        getAllUser()
            .then(res => {
                if (res) setUsers(res.data.map(user => {
                    if(user.roles.includes("ADMIN")) user.name += ' (Administrator)';
                    if(user._id === props.me._id) user.name += ' (Sie)';
                    return user;
                }).sort((a, b) => a.name > b.name));
            })
            .catch(err => props.onNetworkError(err));
    },[update])

    const createUser = (event) => {
        event.preventDefault();
        const elements = event.currentTarget.elements;
        if (elements.password.value !== elements.password_check.value) {
            props.onError({reason: 'Die Passwörter stimmen nicht überein.'})
            return;
        }
        setShowCreate(false);
        const roles = elements.role.checked ? ['ADMIN', 'USER']: ['USER'];
        putCreate(elements.username.value, elements.password.value, elements.url.value, roles)
            .then(() => {
                setUpdate(!update)
                props.onSuccess('User erfolgreich angelegt', 'Der neue User wurde erfolgreich angelegt.')
            })
            .catch(err => props.onNetworkError(err));
    }

    const updateUser = (event) => {
        event.preventDefault();
        const elements = event.currentTarget.elements;
        const roles = elements.role.checked ? ['ADMIN', 'USER']: ['USER'];
        patchUser(currentUser._id, elements.username.value, elements.password.value, elements.url.value, roles)
            .then(() => {
                setShowPatch(false);
                setUpdate(!update)
                props.onSuccess('User erfolgreich aktualisiert', 'Der User wurde erfolgreich aktualisiert.')
            })
            .catch(err => props.onNetworkError(err));
    }

    const deleteUser = () => {
        deleteUserCall(currentUser._id)
            .then( () => {
                if(users.length - 1 <= window) setWindow(window - WINDOW_SIZE);
                setUpdate(!update)
                setCurrentUser({})
                setShowDelete(false)
                props.onSuccess('User erfolgreich gelöscht', 'Der User wurde erfolgreich gelöscht.')
            })
            .catch(err => props.onNetworkError(err));
    }

    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Übersicht über alle User</Card.Title>
                </Card.Header>
                <Card.Body style={{textAlign: "left"}}>
                    {users.slice(window, window + WINDOW_SIZE).map(user => {
                        return (
                            <div key={user._id}>
                                <User data={user} onClickEdit={(user) => {
                                    setCurrentUser(user)
                                    setShowPatch(true)
                                }} onClickDelete={(user) => {
                                    setCurrentUser(user)
                                    setShowDelete(true)
                                }}/>
                                <hr/>
                            </div>
                        )}
                    )}
                </Card.Body>
                <Card.Footer>
                    <Button variant={"success"} onClick={() => setShowCreate(true)}>Neuen User anlegen</Button>
                    <Button variant={"secondary"} id={'dec-window'} onClick={() => setWindow(window - WINDOW_SIZE)} disabled={window <= 0} >{"<"}</Button>
                    {window + 1} bis {users.length < window + WINDOW_SIZE? users.length : window + WINDOW_SIZE}
                    <Button variant={"secondary"} id={'inc-window'} onClick={() => setWindow(window + WINDOW_SIZE)} disabled={window + WINDOW_SIZE >= users.length}>{">"}</Button>
                </Card.Footer>
            </Card>
            <Modal show={showCreate} onHide={() => setShowCreate(false)} size={'lg'}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'}>Neuen User anlegen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CreateForm onSubmit={createUser} style={{width: '70%', alignItems: 'center'}} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'success'} type={'submit'} form={'create-form'} value={'update'}>OK</Button>
                    <Button variant={'warning'} onClick={() => setShowCreate(false)}>Abbrechen</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showPatch} onHide={() => setShowPatch(false)} size={'lg'}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'}>User bearbeiten</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <PatchForm user={currentUser} onSubmit={updateUser} style={{width: '70%', alignItems: 'center'}} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'success'} type={'submit'} form={'patch-form'} value={'update'}>OK</Button>
                    <Button variant={'warning'} onClick={() => setShowPatch(false)}>Abbrechen</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showDelete} onHide={() => setShowDelete(false)}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'} style={{color: 'darkred'}}>User Löschen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Sie sind dabei diesen Account unwiederbringlich zu löschen. <br />
                        Wollen Sie tatsächlich fortfahren?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'danger'} onClick={deleteUser}>Löschen</Button>
                    <Button variant={'warning'} onClick={() => setShowDelete(false)}>Abbrechen</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

UserManagement.propTypes = {
    me: PropTypes.object.isRequired,
    onNetworkError: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
}

export default UserManagement;
