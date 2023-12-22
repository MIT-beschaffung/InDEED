import React from "react";
import PropTypes from "prop-types";
import {Navigate} from "react-router";

const Redirect = (props) => {
    props.onClick()
    return <Navigate replace to={'/'}/>
}

Redirect.propTypes = {
    onClick: PropTypes.func.isRequired
}

export default Redirect;