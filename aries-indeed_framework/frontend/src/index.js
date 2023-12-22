import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import Dashboard from "./views/dashboard/Dashboard";
import reportWebVitals from "./reportWebVitals";

ReactDOM.render(
  <Router>
    <div>
      <Route path="/">
        <Dashboard url="/dashboard" />
      </Route>
    </div>
  </Router>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
