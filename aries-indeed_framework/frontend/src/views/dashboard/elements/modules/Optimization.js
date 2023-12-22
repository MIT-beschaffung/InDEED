import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { Card } from "react-bootstrap";
import { useState, useEffect } from "react";

import { Line } from "react-chartjs-2";

import "./styles.css";

import { getCompilationDataHelper } from "../../../../services/restHandler";

function App() {

  let compilationDataTemplate = {
    timestamp: [],
    // wind: [],
    wasser: [],
    pv: [],
    // biogas: [],
    // geothermie: [],
    graustrom: [],
  };

  var numberOfTxnCompilation = 96 // hier Anzahl der gewünschten Datenpunkte eintragen

  const [compilationData, setCompilationData] = useState(
    compilationDataTemplate
  );

  useEffect(() => {
    getCompilationDataHelper(numberOfTxnCompilation).then((res) => {
      setCompilationData(JSON.parse(res))
    });
    // to prevent warning 'missing dependency: dataLoaded':
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



const timeConverter = (input) => {
  const timestamp = [];
  input.map(x => 
    {
      var date = new Date(x);
      var hours = date.getHours();
      var minutes = "0" + date.getMinutes();

      var formattedTime = hours + ':' + minutes.substr(-2) + " Uhr";
      timestamp.push(formattedTime)
      return;
    })
    return timestamp
}


var data = {
    labels: timeConverter(compilationData.timestamp),
    datasets: [
      // {
      //   label: "Windkraft",
      //   borderColor: "#8AB5E1",
      //   backgroundColor: "#8AB5E1",
      //   data: compilationData.wind,
      // },
      {
        label: "Wasserkraft",
        borderColor: "#356CA5",
        backgroundColor: "#356CA5",
        data: compilationData.wasser,
      },
      {
        label: "Photovoltaik",
        borderColor: "#F7D507",
        backgroundColor: "#F7D507",
        data: compilationData.pv,
      },
      // {
      //   label: "Biomasse",
      //   borderColor: "#92D050",
      //   backgroundColor: "#92D050",
      //   data: compilationData.biogas,
      // },
      // {
      //   label: "Geothermie",
      //   borderColor: "#7A1C1C",
      //   backgroundColor: "#7A1C1C",
      //   data: compilationData.geothermie,
      // },
      {
        label: "Fossil",
        borderColor: "#515151",
        backgroundColor: "#515151",
        data: compilationData.graustrom,
      },
    ],
  };

  var options = {
    responsive: true,
    animation: {
      duration: 50,
      easing: "linear",
    },
    title: {
      display: true,
      text: "Zusammensetzung des Verbrauchs nach Energieträger innerhalb der letzten " + numberOfTxnCompilation/4 + " Stunden",
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
            reverse: true,
            autoSkip: true,
            maxTicksLimit: 24,
          },
          scaleLabel: {
            display: true,
            labelString: "Uhrzeit",
          },
        },
      ],
      yAxes: [
        {
          stacked: true,
          scaleLabel: {
            display: true,
            labelString: "Verbrauch in kWh",
          },
        },
      ],
    },
  };

  function drawLineChart() {
    return (
      <div>
        <Line data={data} options={options} />
      </div>
    );
  }

  return (
    <div className="App" style={{ height: "100%", maxWidth: "1200px" }}>
      <Container style={{}}>
        <Row
          xs={1}
          sm={1}
          md={1}
          lg={1}
          xl={1}
          style={{ marginBottom: "30px" }}
        >
          <Card>
            <Card.Title
              className="text-left"
              style={{ color: "#3C8761", margin: "10px" }}
            >
              {" "}
              Verbrauchshistorie
            </Card.Title>
            <Card.Text className="text-left">{drawLineChart()}</Card.Text>
          </Card>
        </Row>
      </Container>
    </div>
  );
}

export default App;
