import Button from "react-bootstrap/Button";
import { Card } from "react-bootstrap";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import indeedLogo from "../../../resources/InDEED_Logo_pos.svg";
import bmwiLogo from "../../../resources/bmwi.png";
import ffeLogo from "../../../resources/FfE_Logo.PNG";
import ubtLogo from "../../../resources/Bayreuth_transparent.png";
import suerLogo from "../../../resources/suer.jpg";

function bmwiURL() {
  window.open("https://www.bmwi.de/Navigation/DE/Home/home.html", "_blank");
}
function ffeEvURL() {
  window.open("https://www.ffe.de/", "_blank");
}
function suerURL() {
  window.open("https://stiftung-umweltenergierecht.de/", "_blank");
}
function ubtURL() {
  window.open("https://www.uni-bayreuth.de/de/index.html", "_blank");
}

function App() {
  return (
    <div className="App">
        <Card style={{margin: "15px", background: '#FFFFFF' }}>
          <Card.Title
            className="text-left"
            style={{ color: "#3C8761", margin: "10px" }}
          >
            Überblick über das Projekt InDEED
            <img
              src={indeedLogo}
              style={{ float: "right", height: "100px", width: "100px" }}
              alt=""
            />
          </Card.Title>
          <Card.Body
            className="text-center"
            style={{ height: "543.5px", paddingLeft: "10px", background: '#FFFFFF' }}
          >
            <div style={{ textAlign: "justify" }}>
              Das Forschungsprojekt <b>InDEED </b> hat zum Ziel, das Konzept
              einer verteilten Datenplattform auf Blockchain-Basis für
              energiewirtschaftliche Anwendungsfälle sowohl praktisch umzusetzen
              als auch theoretisch wissenschaftlich zu bewerten. Im Fokus stehen
              dabei Analysen zu Potenzialen, Systemrückwirkungen, veränderten
              Wertschöpfungsstrukturen und Wertversprechen sowie der
              Skalierbarkeit.
            </div>
            <br></br>
            <div style={{ textAlign: "justify" }}>
              Ziel des Einsatzes der Blockchain-Technologie ist dabei, die
              Möglichkeit zu schaffen, Plattformen zu realisieren, die für alle
              Akteure gleichermaßen zugänglich sind. Somit dient die verteilte
              Datenplattform primär dem Zweck, die datenbasierte Wertschöpfung
              nicht einzelnen marktbeherrschenden Monopolisten zu überlassen,
              sondern diese, ebenso wie die Energiewende, dezentral zu gestalten
              und auch kleine Akteure an der digitalen Wertschöpfung teilhaben
              zu lassen.
            </div>
            <br></br>
            <div style={{ textAlign: "justify" }}>
              Das Projekt wird durch das Bundesministeriums für Wirtschaft und
              Klimaschutz (BMWK) gefördert (Förderkennzeichen: 03E16026A).
            </div>
            <br></br>
            <div style={{ textAlign: "justify" }}>
              Weitere Informationen zu unseren Forschungsprojekten erhalten Sie{" "}
              {/* <a href="https://www.rw.uni-bayreuth.de/lehrstuehle_wirtschaft/wi-sim/de/forschung/forschungsprojekte/index.html" target="_blank" rel="noreferrer"> */}
              <a href="https://www.fim-rc.de/projekte/oeffentlich-gefoerderte-forschungsprojekte/" target="_blank" rel="noreferrer">
                hier
              </a>
              .
            </div>
            <br></br>
            {/* <div style={{ textAlign: "justify" }}>
              Zum{" "}
              <a href="http://indeed-energy.de:4200/dashboard" target="_blank" rel="noreferrer">
                Asset Logging Frontend
              </a>
              {" "} geht es hier.
            </div> */}


            <div >
              <Row
                style={{ textAlign: "right", marginRight: "auto" }}
                xs={4}
                sm={4}
                md={4}
                lg={4}
                xl={4}
              >
                <Col style={{ display: "inherit" }}>
                  <Button
                    style={{
                      background: "none",
                      borderStyle: "none",
                    }}
                    onClick={bmwiURL}
                  >
                    <img
                      src={bmwiLogo}
                      style={{ height: "auto", width: "70%" }}
                      alt=""
                    />
                  </Button>
                </Col>
                <Col style={{ display: "inherit" }}>
                  <Button
                    style={{
                      background: "none",
                      borderStyle: "none",
                      marginLeft: "20pt"
                    }}
                    onClick={ffeEvURL}
                  >
                    <img
                      src={ffeLogo}
                      style={{ height: "auto", width: "90%" }}
                      alt=""
                    />
                  </Button>
                </Col>
                <Col style={{ display: "inherit" }}>
                  <Button
                    style={{
                      background: "none",
                      borderStyle: "none",
                    }}
                    onClick={suerURL}
                  >
                    <img
                      src={suerLogo}
                      style={{ height: "auto", width: "100%" }}
                      alt=""
                    />
                  </Button>
                </Col>
                <Col style={{ display: "inherit" }}>
                  <Button
                    style={{
                      background: "none",
                      borderStyle: "none",
                    }}
                    onClick={ubtURL}
                  >
                    <img
                      src={ubtLogo}
                      style={{ height: "auto", width: "80%" }}
                      alt=""
                    />
                  </Button>

                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>

        <Card style={{margin: "15px", background: '#d5eadb' }}>
          <Card.Title
            className="text-left"
            style={{ color: "#3C8761"}}
            >
              Hinweis:
          </Card.Title>
          <Card.Body>
            <div style={{ textAlign: "justify" }}>
              Bei dem Pilot-Test von InDEED ist es nach aktuellem Stand leider nur möglich, Ihren Verbrauch anzuzeigen.
              Aufgrund von Änderungen in der Projektplanung werden nun auch Erzeugungswerte an die Plattform geschickt.
              Diese werden bei der Erfassung von Strom aus erneuerbaren Energien berücksichtigt, können aber nicht im "Consumer-Frontend" angezeigt werden.
              Wir informieren Sie hinsichtlich eines etwaigen Updates.
            </div>
          </Card.Body>
        </Card>
    </div>
  );
}

export default App;
