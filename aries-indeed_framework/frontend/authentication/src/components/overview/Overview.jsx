import React from "react";
import {Card} from "react-bootstrap";
import {Link} from "react-router-dom";

import './overview.css'

import indeedLogo from '../../assets/InDEED_Logo.svg';
import bmwiLogo from '../../assets/bmwi.png';
import ffeLogo from '../../assets/ffe_logo.png';
import ubtLogo from '../../assets/UBT_logo.png';
import suerLogo from '../../assets/suer_logo.png';

const URLs = {
    FIM: "https://www.fim-rc.de/projekte/oeffentlich-gefoerderte-forschungsprojekte/",
    assetLogging: "https://indeed-energy.de:4200/dashboard",
    bmwi: "https://www.bmwi.de/Navigation/DE/Home/home.html",
    ffe: "https://www.ffe.de/",
    suer: "https://stiftung-umweltenergierecht.de/",
    UBT: "https://www.uni-bayreuth.de/de/index.html"
}

const Overview = () => {
    //TODO: styling
  return (
      <Card>
          <Card.Title>
              Überblick über das Projekt InDEED
              <img src={indeedLogo} alt={'InDEED Logo'} style={{ float: "right", height: "100px", width: "100px" }}/>
          </Card.Title>
          <Card.Body>
              <Card.Text>
                  Das Forschungsprojekt <b>InDEED</b> hat zum Ziel, das Konzept
                  einer verteilten Datenplattform auf Blockchain-Basis für
                  energiewirtschaftliche Anwendungsfälle sowohl praktisch umzusetzen
                  als auch theoretisch wissenschaftlich zu bewerten. Im Fokus stehen
                  dabei Analysen zu Potenzialen, Systemrückwirkungen, veränderten
                  Wertschöpfungsstrukturen und Wertversprechen sowie der
                  Skalierbarkeit.
              </Card.Text>
              <Card.Text>
                  Ziel des Einsatzes der Blockchain-Technologie ist dabei, die
                  Möglichkeit zu schaffen, Plattformen zu realisieren, die für alle
                  Akteure gleichermaßen zugänglich sind. Somit dient die verteilte
                  Datenplattform primär dem Zweck, die datenbasierte Wertschöpfung
                  nicht einzelnen marktbeherrschenden Monopolisten zu überlassen,
                  sondern diese, ebenso wie die Energiewende, dezentral zu gestalten
                  und auch kleine Akteure an der digitalen Wertschöpfung teilhaben
                  zu lassen.
              </Card.Text>
              <Card.Text>
                  Das Projekt wird durch das Bundesministeriums für Wirtschaft und
                  Klimaschutz (BMWK) gefördert (Förderkennzeichen: 03E16026A).
              </Card.Text>
              <Card.Text>
                  Weitere Informationen zu unseren Forschungsprojekten erhalten Sie{" "}
                  <a href={URLs.FIM} target="_blank" rel="noopener noreferrer"> hier</a>.
              </Card.Text>
              {/* <Card.Text>
                  Zum{" "}
                  <a href={URLs.assetLogging} target="_blank" rel="noopener noreferrer">Asset Logging Frontend</a>
                  {" "} geht es hier.
              </Card.Text> */}
              <br/>
              <Link to={URLs.bmwi} target={'_blank'} rel={'noreferrer'}>
                  <img src={bmwiLogo} alt={'bmwi Logo'} style={{ height: "100px"}}/>
              </Link>
              <Link to={URLs.ffe} target={'_blank'} rel={'noreferrer'}>
                  <img src={ffeLogo} alt={"ffe Logo"} style={{ height: "100px"}}/>
              </Link>
              <Link to={URLs.suer} target={'_blank'} rel={'noreferrer'}>
                  <img src={suerLogo} alt={"suer Logo"} style={{ height: "100px"}}/>
              </Link>
              <Link to={URLs.UBT} target={'_blank'} rel={'noreferrer'}>
                  <img src={ubtLogo} alt={"ubt logo"} style={{ height: "100px"}}/>
              </Link>

          </Card.Body>
    </Card>
  )
}

export default Overview;