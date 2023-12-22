import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { Card } from "react-bootstrap";
import { useState, useEffect } from "react";
import { WindMillLoading } from 'react-loadingg';
import { Line } from "react-chartjs-2";

import "./consumption.css"

import { getLocalConsumptionDataHelper } from "../../../services/restHandler";

function App() {
    let grayShare = 0;

    const dummyData = {id: "keine",
      localTimeSeries: [ 
        [12354676, 2543, 2011],
        [12354676, 2543, 2011],
        [12345677, 5123, 1482],
        [12345678, 2346, 1482],
        [12354679, 4781, null],
        [12354682, 1123, 362],
        [12354683, 4781, 2523],
        [12354684, 3571, 1525],
    ]};

    var labeledConsumptionDataTemplate = {
        timestamp : dummyData.localTimeSeries.map(x => x[0]),
        consumption : dummyData.localTimeSeries.map(x => x[1]),
        greenShare: dummyData.localTimeSeries.map(x => x[2]),
    };

    const numberOfTxnlabeledConsumption = 96 // hier Anzahl der gewünschten Datenpunkte eintragen

    const [dataLoaded, setDataLoaded] = useState(false);
    
    const [labeledConsumptionData, setlabeledConsumptionData] = useState({
          timestamp: [],
          consumption: [],
          greenShare: []
        });

    const getData = () => {
      getLocalConsumptionDataHelper(numberOfTxnlabeledConsumption).then((res) => {
        if (res) {
          // console.log(res);
          res = JSON.parse(res);
          if(!(res.localTimeSeries)){console.warn("localTimeSeries is undefined"); return {}};
          let labeledConsumptionData = {
            timestamp : res.localTimeSeries.map(x => x[0]).reverse(),
            consumption : res.localTimeSeries.map(x => x[1]).reverse(),
            greenShare: res.localTimeSeries.map(x => (x[2]==null)?null: Math.round( (x[2]) *100)/100 ).reverse()
          }
          setlabeledConsumptionData(labeledConsumptionData);
        }
      });
    }

  useEffect( () => {
    getData()
    const interval = setInterval(getData,60000)

    setDataLoaded(true);
    return ()=>clearInterval(interval)
  },[])

  const timeConverter = (input) => {
      return input.map(x => {
        const date = new Date(x*1000);
        return `${date.getHours()}:${date.getMinutes().toLocaleString('de-DE', {minimumIntegerDigits: 2})}`
      })
  }

  const calcGray = (consumption, greenShare) => {
    const share = [];
    for(let i=0; i<consumption.length; i++) {
      if ( greenShare[i] > consumption[i] ) {
        console.warn("At LocalConsumption[" + i + "] (calcGray): Green share exceeds consumption! Set grayShare to 0");
        share.push(0);
      } else {
        share.push( Math.round( (consumption[i]-greenShare[i])*100 )/100 );
      }
    }
    return share;
  }
  grayShare = calcGray(labeledConsumptionData.consumption, labeledConsumptionData.greenShare);

  var data = {
      labels: timeConverter(labeledConsumptionData.timestamp),
      datasets: [
        {
          label: "Grünstromanteil",
          borderColor: "#92D050",
          backgroundColor: "#92D050",
          data: labeledConsumptionData.greenShare,
        },
        {
          label: "Graustromanteil",
          borderColor: "#515151",
          backgroundColor: "#515151",
          data: grayShare,
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
        text: "Zusammensetzung des Verbrauchs nach Grün-/Graustrom innerhalb der letzten " + numberOfTxnlabeledConsumption/4 + " Stunden",
      },
      tooltips: {
        mode: "index",
        callbacks: {
          label: function (tooltipItem, data) {
            return data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' kW';
          }
        }
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
              min: 0,
              max: 24,
              stepSize: 1,
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
              labelString: "Verbrauch (kW)",
            },
          },
        ],
      },
    };
  
    function drawLineChart() {
      return (
        // <div>
          <Line data={data} options={options} />
        // </div>
      );
    }

  return (
      <>
          {dataLoaded ? (
              <Card style={{margin: "15px"}}>
                <Card.Title className="text-left"> Verbrauchshistorie </Card.Title>
                <Card.Body className="text-left"> {drawLineChart()}</Card.Body>
              </Card>
        ) : (
            <div><WindMillLoading size="large" color="#23272A"/></div>
        )}
      </>
  );
  }
  
  export default App;
  
