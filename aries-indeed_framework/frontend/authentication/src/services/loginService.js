import axios from 'axios';

const authBackend = axios.create({
    baseURL: 'https://auth.indeed-energy.de/authentication', // don't use www. because it will cause a CORS error
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

export const  postLogin = async (username, pwd) => {
    return await authBackend.post("/login", {username: username, password: pwd});
    // object naming has to match the interface of passport package
};

export const postLogout = async (id) => {
    return await authBackend.post("/logout/" + id);
};

export const putChange = async (id, old_pwd, new_pdw) => {
    return await authBackend.put("/change/" + id, {old_pwd: old_pwd, new_pwd: new_pdw});
    // object naming has to match the odt naming
}

export const putCreate = async (name, pwd, url, roles) => {
    return await authBackend.put("/create", {name: name, pwd_hash: pwd, url:url, roles: roles});
};

export const deleteUserCall = async (id) => {
    return await authBackend.delete("/" + id);
};

export const getCredentials = async () => {
    return await authBackend.get("/credentials");
}

export const getAllUser = async () => {
    return await authBackend.get("/user");
}

export const patchUser = async (id, name= "", pwd = "", url = "", roles = [] ) => {
    const data = {};
    if (name !== "") data.name = name;
    if (pwd !== "") data.pwd_hash = pwd;
    if (url !== "") data.url = url;
    if (roles !== []) data.roles = roles;
    console.log(data)
    return await authBackend.patch("/" + id, data);
}

export const handleAxiosError = (error) => {
    const res = {title: "", reason: "", msg: ""}
    if (error.response) {
        // The request was made and the server responded with an error code
        res.title = error.response.status;
        res.reason = 'Bei der Serveranfrage ist ein Fehler aufgetreten.';
        res.msg = error.message;
    } else if (error.request) {
        // The request was made but no response was received
        res.reason = 'Keine Antwort vom Server.';
    } else {
        // Something happened in setting up the request that triggered an Error
        res.reason = 'Die Serveranfrage konnte nicht abgesendet werden.'
        res.msg = error.message;
    }
    return res
}