import React from "react";
import {Button} from "react-bootstrap";
import PropTypes from "prop-types";

const User = (props) => {

    return (
        <table style={{minWidth: "100%"}}>
            <tbody style={{minWidth: "100%"}}>
                <tr style={{minWidth: "100%"}}>
                    <td style={{minWidth: "80%", textAlign: "left"}}>{props.data.name}</td>
                    <td style={{width: "200px", textAlign: "right"}}>
                        <Button variant={'warning'} onClick={() => props.onClickEdit(props.data)}>Bearbeiten</Button>
                    </td>
                    <td style={{width: "150px", textAlign: "right"}}>
                        <Button variant={'danger'} onClick={() => props.onClickDelete(props.data)}>Löschen</Button>
                    </td>
                </tr>
            </tbody>
        </table>
    )

}

User.propTypes = {
    data: PropTypes.object.isRequired,
    onClickEdit: PropTypes.func.isRequired,
    onClickDelete: PropTypes.func.isRequired
}

export default User;