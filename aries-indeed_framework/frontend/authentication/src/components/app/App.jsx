import React, {useEffect, useState} from "react";
import {Routes} from "react-router";
import {Route, BrowserRouter as Router, NavLink} from "react-router-dom";
import {Button, Dropdown, DropdownButton, Modal, Navbar} from "react-bootstrap";
import Overview from "../overview/Overview";
import {
    postLogin,
    postLogout,
    putChange,
    handleAxiosError,
    getCredentials
} from "../../services/loginService";

import "bootstrap/dist/css/bootstrap.css";
import './app.css';
import './forms.css';
import '../manage/modal.css';

import loginIcon from '../../assets/loginIcon.svg';
import Manage from "../manage/Manage";
import LoginForm from "../overview/LoginForm";
import ChangeForm from "../overview/ChangeForm";
import Redirect from "../overview/Redirect";

export const App = () => {

    //TODO use store
    const [user, setUser] = useState({});
    const [showLogin, setShowLogin] = useState(false);
    const [showChange, setShowChange] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [message, setMessage] = useState({
        title: "",
        reason: "",
        msg: ""
    })

    useEffect(() => {
        autoLogin();
    },[])

    const autoLogin = () => {
        getCredentials()
            .then( res => {
                setUser(res.data.user);
            })
            .catch(); //ignore the error if not already logged in
    }

    const login = (event) => {
        /*
         * Axios will abort the request if you don't add this call to suppress the default behavior of react.
         * This error occurs then you are using submit buttons, and is related to how react deals with form submits.
         */
        event.preventDefault();
        const elements = event.currentTarget.elements;
        postLogin(elements.username.value, elements.password.value)
            .then(res => {
                setUser(res.data.user);
                setShowLogin(false);
            })
            .catch(error => {
                handleError(error);
                setShowLogin(false);
            });
        //TODO: redirect to correct url?
    }

    const logout = () => {
        postLogout(user._id)
            .then(() => {
                setUser({});
                window.location.replace('https://auth.indeed-energy.de');
            })
            .catch(error => {
                handleError(error);
                setShowLogout(false);
            });
    }

    const changePassword = (event) => {
        event.preventDefault();
        const elements = event.currentTarget.elements;
        if (elements.new_password.value !== elements.new_password_check.value) {
            setMessage({title: "", reason: 'Die Passwörter stimmen nicht überein.', msg:""});
            setShowError(true);
            return;
        }
        putChange(user._id, elements.old_password.value, elements.new_password.value)
            .then(() => {
                setUser({});
                setShowChange(false);
                handleSuccess('Passwort erfolgreich geändert', 'Bitte melden Sie sich mit ihrem neuen Passwort an.');
            })
            .catch(error => handleError(error));
    }

    const protect = (element) => {
        return user._id ? element : <Redirect onClick={() => setShowLogin(true)}/>
    }

    const handleError = error => {
        setMessage(handleAxiosError(error));
        setShowError(true);
    }

    const handleSuccess = (title, msg) => {
        setMessage({title: title, reason: "", msg: msg});
        setShowSuccess(true);
    }

    //TODO: Settings icon and dropdown menu
    //TODO: modal component
    return (

        <Router>
            <Navbar>
                {user._id ?
                    <DropdownButton title={user.name}>
                        {user.roles.includes('ADMIN') ?
                            <NavLink to={'/manage'} className={'dropdown-item'}>User verwalten</NavLink>
                            : <Dropdown.Item href={user.url.href + 'dashboard'}>User Page</Dropdown.Item>}
                        <Dropdown.Item onClick={() => setShowChange(true)}>Passwort ändern</Dropdown.Item>
                        <NavLink to={'/'} onClick={() => setShowLogout(true)} className={'dropdown-item'}>Logout</NavLink>
                    </DropdownButton>
                    :
                    <NavLink to={'/'} className={'nav-link'} onClick={() => setShowLogin(true)}>
                        <img src={loginIcon} alt={"Login Icon"} style={{marginRight: '10px'}}/>
                        Login
                    </NavLink>
                }
                <NavLink to={'/'} className={'nav-link'}>Home</NavLink>
            </Navbar>
            <Modal show={showChange} onHide={() => setShowChange(false)}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'}>Passwort ändern</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ChangeForm onSubmit={changePassword} style={{width: '70%', alignItems: 'center'}} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'success'} type={'submit'} form={'change-form'} value={'update'}>OK</Button>
                    <Button variant={'warning'} onClick={() => setShowChange(false)}>Abbrechen</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showLogout} onHide={() => setShowLogout(false)}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'}>Ausloggen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Sie sind dabei Sich auszuloggen. <br/> Wollen Sie fortfahren?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'success'} onClick={logout}>Ausloggen</Button>
                    <Button variant={'warning'} onClick={() => setShowLogout(false)}>Abbrechen</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showError} onHide={() => setShowError(false)}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'} style={{color: 'darkred'}}>Fehler: {message.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{message.reason}<br/>{message.msg}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'secondary'} onClick={() => setShowError(false)}>Schließen</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showSuccess} onHide={() => setShowSuccess(false)}
                   aria-labelledby={'contained-modal-title-vcenter'} centered >
                <Modal.Header>
                    <Modal.Title id={'contained-modal-title-vcenter'} >{message.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{message.msg}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'secondary'} onClick={() => setShowSuccess(false)}>Schließen</Button>
                </Modal.Footer>
            </Modal>
            <Routes>
                <Route index element={
                    <>
                        <Overview/>
                        <Modal show={showLogin} onHide={() => setShowLogin(false)}
                               aria-labelledby={'contained-modal-title-vcenter'} centered >
                            <Modal.Header>
                                <Modal.Title id={'contained-modal-title-vcenter'}>Login</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <LoginForm onSubmit={login} style={{width: '70%', alignItems: 'center'}} />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant={'success'} type={'submit'} form={'login-form'} value={'update'}>Anmelden</Button>
                                <Button variant={'warning'} onClick={() => setShowLogin(false)}>Abbrechen</Button>
                            </Modal.Footer>
                        </Modal>
                    </>
                } />
                <Route path={'/manage'} element={ protect(<Manage me={user}
                                                                  onError={(error) => {setMessage(error); setShowError(true)}}
                                                                  onNetworkError={handleError} onSuccess={handleSuccess}/>) } />
                <Route path={'/logout'} element={ <Redirect onClick={() => setShowLogout(true)} /> } />
                <Route path={'*'}       element={ <Redirect onClick={() => {
                    setMessage({title: "404", reason: "Page not Found", msg:""});
                    setShowError(true);
                }} /> } />
            </Routes>
        </Router>
    );
}

export default App;