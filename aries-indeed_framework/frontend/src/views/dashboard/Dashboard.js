import "../../App.css";
import Button from "react-bootstrap/Button";

import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-slider/dist/css/bootstrap-slider.css";

import indeedLogo from "../../resources/InDEED_Logo.svg";
import dashboardIcon from "../../resources/dashboardIcon_active.svg";
import dashboardIconDeact from "../../resources/dashboardIcon_deact.svg";
import consumptionIcon from "../../resources/consumptionIcon_active.svg";
import consumptionIconDeact from "../../resources/consumptionIcon_deact.svg";
import localConsumptionIcon from "../../resources/localConsumptionIcon_active.svg";
import localConsumptionIconDeact from "../../resources/localConsumptionIcon_deact.svg";
import optimizationIcon from "../../resources/optimizationIcon_active.svg";
import optimizationIconDeact from "../../resources/optimizationIcon_deact.svg";
import logoutIcon from "../../resources/logoutIcon.svg";
import mapIcon from "../../resources/map_active.svg";
import mapIconDeact from "../../resources/map_deact.svg";
import footprintIcon from "../../resources/nEWfootprint_active.svg";
import footprintIconDeact from "../../resources/nEWfootprint_deact.svg";

import { useLocation } from "react-router-dom";

import {Route, Link } from "react-router-dom";

import Consumption from "./elements/Consumption_new";
import LocalConsumption from "./elements/LocalConsumption";
import Welcome from "./elements/Welcome";
import Emission from "./elements/Emission";
import Prioritization from "./elements/Prioritization";
import Origin from "./elements/Origin_new"
import {useEffect} from "react";
import {getLocation} from "../../services/restHandler";

function App({ url }) {

    useEffect(() => {
        //hack to check if logged in
        getLocation().then().catch(err => {
            if (err.response.statusCode === 401) window.location.replace('https://auth.indeed-energy.de/')
        })
    }, [])

  let topBarHeight = "60px";
  let sideBarWidth = "300px";

  let currentPath = useLocation().pathname;

  let ribbonElements = [
    {
      iconA: dashboardIcon,
      iconD: dashboardIconDeact,
      name: "ÜBERBLICK",
      url: "",
    },
    {
      iconA: optimizationIcon,
      iconD: optimizationIconDeact,
      name: "PRIORISIERUNG",
      url: "/Prioritization",
    },
    {
      iconA: consumptionIcon,
      iconD: consumptionIconDeact,
      name: "VERBRAUCH",
      url: "/Consumption",
    },
    {
      iconA: localConsumptionIcon,
      iconD: localConsumptionIconDeact,
      name: "LOKALVERBRAUCH",
      url: "/LocalConsumption",
    },
    {
      iconA: mapIcon,
      iconD: mapIconDeact,
      name: "STROMHERKUNFT",
      url: "/Origin",
    },
    {
      iconA: footprintIcon,
      iconD: footprintIconDeact,
      name: "EMISSIONEN",
      url: "/Emission",
    }
  ];


  function drawRibbon() {
    return ribbonElements.map((el) => {
      return (
        <div key={el.name}>
          <Link to={url + el.url}>
            {"/dashboard" + el.url === currentPath ? (
              <Button
                className="text-left"
                style={{
                  height: "50px",
                  width: "243px",
                  textAlign: "center",
                  backgroundColor: "#D5EADB",
                  border: "none",
                  fontSize: "20px",
                  fontFamily: "Avenir Next (Medium)",
                  color: "lightgray",
                  margin: "10px",
                }}
              >
                <div
                  style={{ width: "30px", float: "left", textAlign: "center" }}
                >
                  <img src={el.iconA} alt=""/>
                </div>
                <div style={{ float: "left", color: "#23272A" }}>
                  {el.name}
                </div>
              </Button>
            ) : (
              <Button
                className="text-left"
                style={{
                  height: "50px",
                  width: "243px",
                  textAlign: "center",
                  backgroundColor: "#191919",
                  border: "none",
                  fontSize: "20px",
                  fontFamily: "Avenir Next (Medium)",
                  color: "lightgray",
                  margin: "10px",
                }}
              >
                <div
                  style={{ width: "30px", float: "left", textAlign: "center" }}
                >
                  <img src={el.iconD}  alt=""/>
                </div>
                <div style={{ float: "left", color: "#D5EADB" }}>
                  {el.name}
                </div>
              </Button>
            )}
          </Link>
        </div>
      );
    });
  }

  return (
    <div className="App">
      
      <Navbar
        className="justify-content-end"
        bg="dark"
        variant="dark"
        fixed="top"
        height="40px"
        padding="0px"
      >
        {/* <Navbar.Brand href="#home">InDEED</Navbar.Brand> */}
        <div style={{ textAlign: "right" }}>
          <Link to="" style={{ color: "#D5EADB" }}>
            <img src={logoutIcon}  alt=""/>
            <Button onClick={() => window.location.replace('https://auth.indeed-energy.de/logout')} style={{
          background: "#373a47",
          borderStyle : "unset"}}
          > Logout </Button>
          </Link>
        </div>
      </Navbar>
      <div
        id = "sideBar"
        style={{
          width: `${sideBarWidth}`,
          height: "calc(100vh - 40px)",
          minHeight: "650px",
          background: "#23272A",
          float: "left",
          top: "40px",
          position: "relative",
          overflow : "hidden"
        }}
      >
        
        <br />
        <div>
          <img src={indeedLogo}  alt=""/>
        </div>
        <br />
        <div>{drawRibbon()}</div>
      </div>
      <div
        style={{
          width: `calc(100% - ${sideBarWidth})`,
          height: "100vh",
          float: "left",
        }}
      >
        <div
          style={{
            height: `calc(100% - ${topBarHeight})`,
            background: "",
            overflowY: "scroll",
            position: "relative",
            top: "60px",
          }}
        >         
          <Route
            path={url + "/Consumption"}
            component={Consumption}
            style={{ transition: "width 2s" }}
          />   
          <Route
            path={url + "/LocalConsumption"}
            component={LocalConsumption}
          />
          <Route path={url + "/Prioritization"} component={Prioritization} />
          <Route path={url + "/Emission"} component={Emission} />
          <Route path={url + "/Origin"} component={Origin} />
          <Route exact path={url} component={Welcome} />
        </div>
      </div>
    </div>
  );
}

export default App;
