import Button from "react-bootstrap/Button";
import { Card } from "react-bootstrap";
import { useState, useEffect } from "react";
import { UncontrolledPopover, PopoverHeader, PopoverBody } from "reactstrap";

import { Line } from "react-chartjs-2";

import "./styles.css";

import {
  getForecastDataHelper,
  getFootprintDataDataHelper,
} from "../../../../services/restHandler";

let f = new Intl.DateTimeFormat('de', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  timeZone: 'Europe/Berlin'
});

function App() {

  const [footprintData, setFootprintData] = useState({
    timestamp: "",
    days: {
      "1d": 0,
      "7d": 0,
      "30d": 0
    }
  });

  useEffect(() => {
    getFootprintDataDataHelper().then((result) => {
      console.log("footprint");
      if(result){
        result = JSON.parse(result)
        console.log(result);
        setFootprintData(result);
      }  // TODO handle JSON error
    });
  }, []);

  function atmosfair() {
    window.open(
      "https://www.atmosfair.de/de/kompensieren/wunschmenge/",
      "_blank"
    );
  }

  const [emissionData, setEmissionData] = useState({
    timestamp: [],
    emission: []
  });

  useEffect(() => {
    getForecastDataHelper().then((res) => {
      // den promise, also der Datenbankeintrag aus forecast.db wird hier geladen
      console.log("forecast from api:" + res);
      res = JSON.parse( res); // erhaltener Promise wird als JSON gespeichert (obwohl in der Datenbank bereits als JSON abgespeichert, scheint das nicht ganz zu funktionieren)

      console.log("forecast from api:" + res);
      let data = {
        timestamp: [],
        emission: [],
      }; // ERstellung neues Objekt "data" mit timestamp und emission als keys und leeren arrays als werten
      if(res.forecast !== undefined) {
        res.forecast.data.forEach((el) => {
          data.timestamp.push(new Date(el.epoch * 1000));
          data.emission.push(Math.round(el.data.value_mean));
        });

        console.log("data:" + data);
      }
      setEmissionData(data); // diese Funktion nimmt "data" und überschreibt "emissionDataTemplates", und speichert es in eine neue Variable "emissionData", mit welcher weiter arbeiten können
    });
  }, []);

  const data = {
    labels: emissionData.timestamp.map(element => f.format(element)),
    datasets: [
      {
        label: "THG-Prognose",
        fill: false,
        lineTension: 0.1,
        borderColor: "#23272A",
        backgroundColor: "#23272A",
        data: emissionData.emission.reverse(),
      },
    ],
  };

  const options = {
    responsive: true,
    animation: {
      duration: 50,
      easing: "linear",
    },
    title: {
      display: true,
      text:
        "Prognose der spezifischen Treibhausgasemissionen (THG) des Strommixes in Deutschland für den Folgetag",
    },
    tooltips: {
      mode: "index",
    },
    hover: {
      mode: "index",
    },
    scales: {
      xAxes: [
        {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 24,
          },
          scaleLabel: {
            display: true,
            labelString: "",
          },
        },
      ],
      yAxes: [
        {
          stacked: true,
          scaleLabel: {
            display: true,
            labelString: "THG-Emissionen in gCO₂eq/kWh_el",
          },
        },
      ],
    },
  };

  function drawLineChart() {
    console.log(options)
    return (
      <div style={{ width: "800px" }}>
        <Line data={data} options={options} />
      </div>
    );
  }

  return (
    <>
        <Card>
          <Card.Title>Prognose Treibhausgasemissionen</Card.Title>
          <Card.Body>
            <div className={"emission-grid-container"}>
              <div style={{gridArea: "chart", maxWidth: "90%"}}>
                <Line data={data} options={options} />
              </div>
              <Button className={'button'} style={{fontFamily: "Avenir Next (Medium)", gridArea: "button1", justifySelf: "end"}}
                      id="PopoverLegacy" type="button">Weitere Informationen</Button>
              <UncontrolledPopover trigger="legacy" placement="bottom" target="PopoverLegacy">
                <PopoverHeader>Infobox</PopoverHeader>
                <PopoverBody>
                  <div>
                    Die Prognose basiert auf Day-Ahead Prognose der {" "}
                    <a href="https://transparency.entsoe.eu/" target="_blank" rel="noreferrer">ENTSO-E</a>
                    {" "}zu{" "}
                    <a href="https://transparency.entsoe.eu/load-domain/r2/totalLoadR2/show" target="_blank" rel="noreferrer">Last</a>
                    ,{" "}
                    <a href="https://transparency.entsoe.eu/generation/r2/dayAheadGenerationForecastWindAndSolar/show" target="_blank" rel="noreferrer"> Erzeugung aus Windkraft- und PV-Anlagen </a>
                    ,{" "}
                    <a href="https://transparency.entsoe.eu/transmission-domain/r2/dayAheadPrices/show?name=&defaultValue=false&viewType=TABLE&areaType=BZN&atch=false&dateTime.dateTime=08.04.2021+00:00%7CCET%7CDAY&biddingZone.values=CTY%7C10Y1001A1001A83F!BZN%7C10Y1001A1001A82H&dateTime.timezone=CET_CEST&dateTime.timezone_input=CET+(UTC+1)+/+CEST+(UTC+2)" target="_blank" rel="noreferrer">Strompreisen</a>
                    {" "}sowie weiteren Parametern (z.B. Wochentag). 
                    Die Werte werden mit einem Machine Learning Tool berechnet, welches mit historischen Daten trainiert wurde.
                    
                    Weitere Informationen zur Prognose erhalten Sie auf der Webseite der <a href="https://www.ffe.de/veroeffentlichungen/tagesaktuelle-spezifische-thg-emissionen/" target="_blank" rel="noreferrer"> FfE</a>. 
                    Die Daten sind öffentlich auf der <a href="https://opendata.ffe.de/daily-updated-specific-greenhouse-gas-emissions-of-the-german-electricity-mix/" target="_blank" rel="noreferrer"> FfE Open-Data Plattform</a> verfügbar.
                  </div>
                </PopoverBody>
              </UncontrolledPopover>
              { <table style={{gridArea: 'table', width: "90%", justifySelf: "end"}}>
                <caption className={"text-center"}>Werte bezogen auf meinen Graustrom-Anteil</caption>
                <thead>
                  <th>Letzte 30 Tage </th>
                  <th>Letzte 7 Tage </th>
                  <th>Letzte 24 Stunden </th>
                </thead>
                <tbody>
                <tr>
                  <td><span className={"value"}>{Math.round(footprintData.days["30d"] / 1000)}</span> kg</td>
                  <td><span className={"value"}>{Math.round(footprintData.days["7d"] / 1000)}</span> kg</td>
                  <td><span className={"value"}>{Math.round(footprintData.days["1d"] / 1000)}</span> kg</td>
                </tr>
                </tbody>
              </table> }
            </div>
          </Card.Body>
        </Card>
    </>
  );
}

export default App;
