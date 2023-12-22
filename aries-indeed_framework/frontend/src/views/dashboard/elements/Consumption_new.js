import { Card } from "react-bootstrap";
import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import Chart from "./modules/Optimization_new";
import { WindMillLoading } from 'react-loadingg';
import './consumption.css' //TODO: side effects of css?
import {
    getConsumptionDataHelper,
    getCompilationAverageDataHelper,
    getCompilationDataHelper
} from "../../../services/restHandler";
import Button from "react-bootstrap/Button";
import { UncontrolledPopover, PopoverHeader, PopoverBody } from "reactstrap";

const labels = {
    // WINDKRAFT: "Windkraft",
    WASSERKRAFT: "Wasserkraft",
    PHOTOVOLTAIK: "Photovoltaik",
    // BIOMASSE: "Biomasse",
    // GEOTHERMIE: "Geothermie",
    FOSSIL: "Graustrom"
}
const backgroundColors = {
    // LIGHT_BLUE: "#8AB5E1",
    BLUE: "#356CA5",
    YELLOW: "#F7D507",
    // GREEN: "#92D050",
    // BROWN: "#7A1C1C",
    GRAY: "#515151"
}
const NUMBER_OF_TXN_COMPILATION = 96 // hier Anzahl der gewünschten Datenpunkte für den Chart eintragen
const HEIGHT_OF_PIE_CHARTS = 60


function date2String(unix) {
    const date = new Date(unix)
    return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}, um ${date.getHours()}:${date.getMinutes()
        .toLocaleString('de-DE', {minimumIntegerDigits: 2})} Uhr`
}

function round(consumption) {
    return Math.round(consumption * 100) / 100
}

const timeConverter = (input) => {
    return input.map(x => {
        const date = new Date(x*1000);
        return `${date.getHours()}:${date.getMinutes().toLocaleString('de-DE', {minimumIntegerDigits: 2})}`
    })
}

function generatePieData(data, labels, colors) {

    console.log(data)
    let values = Object.values(data)
    // console.log(values)
    const totalConsumption = values.reduce((e, a) => a += e)
    values = values.map(e => ((e / totalConsumption) * 100).toFixed(0)) // convert to %
    console.log(labels)
    console.log(values)
    console.log(colors)
    
    return  {
        labels: Object.values(labels),
        datasets: [
            {
                data: values,
                backgroundColor: Object.values(colors),
            },
        ]
    }
}

const CurrentConsumption = (props) => {
    return (
        <Card className={props.className}>
            <Card.Title> Aktueller Verbrauch </Card.Title>
            <Card.Body>
                <div>
                    <span className={"value"}> { round(props.data /12)} </span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <span className={"info"}>
                        <p>Letztes 5-Min-Intervall</p> 
                        {/* <p>(Falls negativ, Erzeugungswert)</p> */}
                    </span>
                </div>
            </Card.Body>
        </Card>
    )
}

const MeterReading = (props) => {
    return (
        <Card className={props.className}>
            <Card.Title> Zählerstand </Card.Title>
            <Card.Body>
                <div>
                    <span className={"value"}> { round(props.data /12) } </span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <span className={"info"}> Letzter Stand vom { date2String(props.date) } </span>

                    <Button  className={"button"}
                    // style={{fontFamily: "Avenir Next (Medium)", gridArea: "button1", justifySelf: "end"}}
                        id="PopoverLegacy" type="button">Weitere Informationen</Button>
                    <UncontrolledPopover trigger="legacy" placement="bottom" target="PopoverLegacy">
                        <PopoverHeader>Zählerstand</PopoverHeader>
                        <PopoverBody>
                        <div>
                        Da wir im InDEED Pilot-Test lediglich virtuell die Strommengen zuordnen, gibt der Wert “Zählerstand“ nicht Ihren tatsächlichen Zählerstand an. 
                        Vielmehr ist es die Summe {/* Ihrer Erzeugung bzw. */} Ihres Verbrauchs, die bisher an die InDEED Plattform übermittelt wurde. 
                        Da es sich weiter um einen Feldversuch handelt, kann es u.U. aufgrund technischer Probleme auf der Plattform zu Datenlücken und somit Verfälschungen der Werte kommen.
                        </div>
                        </PopoverBody>
                    </UncontrolledPopover>
                </div>
            </Card.Body>
        </Card>
    )
}

const AverageConsumption = (props) => {
    return (
        <Card className={props.className}>
            <Card.Title> Durchschnittsverbrauch </Card.Title>
            <Card.Body>
                <div>
                    <label> Letzte 15 Min: </label>
                    <span className={"value"}> {round(props.data["15m"]/12)}</span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <label> Letzte 1 Stunde: </label>
                    <span className={"value"}> {round(props.data["1h"]/12)}</span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <label> Letzte 24 Stunden: </label>
                    <span className={"value"}> {round(props.data["24h"]/12)}</span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <label> Letzte 7 Tage: </label>
                    <span className={"value"}> {round(props.data["7d"]/12)}</span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <label> Letzte 30 Tage: </label>
                    <span className={"value"}> {round(props.data["30d"]/12)}</span>
                    <span className={"unit"}> kWh </span>
                </div>
                <div>
                    <span className={"info"}> Durchschnittlicher Stromverbrauch über angegebenen Zeitraum </span>
                </div>
            </Card.Body>
        </Card>
    )
}

const AverageElectricityShare = (props) => {
    // Last Pie is 10px bigger due to the legend
    return (
        <Card className={props.className} style={{backgroundColor: "#D5EADB"}}>
            <Card.Title> Bezogener Strommix nach Energieträger </Card.Title>
            <Card.Body>
                <div>
                    <label> Tag: </label>
                    <Pie data={props.day} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
                </div>
                <div>
                    <label> Woche: </label>
                    <Pie data={props.week} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
                </div>
                <div>
                    <label> Monat: </label>
                    <Pie data={props.month} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
                </div>
                <div>
                    <label> Jahr: </label>
                    <Pie data={props.year} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
                </div>
                <div>
                    <Pie data={{labels: Object.values(labels), datasets: [{data: [], backgroundColor: Object.values(backgroundColors)}]}}
                         options={{ legend: { display: true, position: 'bottom', labels: {filter: (label, chart) => {label.hidden = false; return true;}} } }}
                         height={40}/>
                </div>
            </Card.Body>
        </Card>
    )
}

const Consumption = () => {

    const [consumptionData, setConsumptionData] = useState({
        currentConsumption: {
            consumption: 0,
        },
        timestamp: Date.now() / 1000,
        totalConsumption: 0,
        averageConsumption: {
            "15m": 0,
            "1h": 0,
            "24h": 0,
            "7d": 0,
            "30d": 0,
        },
        historicConsumption: [{ timestamp: Date.now(), consumption: 0 }],
    })
    const [averageData, setAverageData] = useState({averageConsumption: {
                "1d": {
                    // wind: 0,
                    wasser: 0,
                    pv: 0,
                    // biogas: 0,
                    // geothermie: 0,
                    graustrom: 0,
                },
                "7d": {
                    // wind: 0,
                    wasser: 0,
                    pv: 0,
                    // biogas: 0,
                    // geothermie: 0,
                    graustrom: 0,
                },
                "30d": {
                    // wind: 0,
                    wasser: 0,
                    pv: 0,
                    // biogas: 0,
                    // geothermie: 0,
                    graustrom: 0,
                },
                "365d": {
                    // wind: 0,
                    wasser: 0,
                    pv: 0,
                    // biogas: 0,
                    // geothermie: 0,
                    graustrom: 0,
                },
            },
        })
    const [dataLoaded, setDataLoaded] = useState(false) // counter for useEffects
    const [compilationData, setCompilationData] = useState({
        timestamp: [],
        // wind: [],
        wasser: [],
        pv: [],
        // biogas: [],
        // geothermie: [],
        graustrom: [],
    })

    const getData = () => {
        getConsumptionDataHelper().then((res) => {
            // It takes some uptime until results get returned,
            // average data will be updated every 15 minutes form the server
            if(res) {
                res = JSON.parse(res);
                res.currentConsumption.consumption = round(res.currentConsumption.consumption / 1000);
                res.totalConsumption = round(res.totalConsumption / 1000);
                Object.keys(res.averageConsumption).forEach(key =>
                    res.averageConsumption[key] = round(res.averageConsumption[key] / 1000)
                );
                setConsumptionData(res);
            }
        })

        getCompilationAverageDataHelper().then((res) => {
            if (res) {
                res = JSON.parse(res)
                if (res.averageConsumption) setAverageData(res)
            }
        })

        getCompilationDataHelper(NUMBER_OF_TXN_COMPILATION).then(res => {
            if (res) setCompilationData(JSON.parse(res))
        });
    }

    useEffect(() => {
        // one use Effect in order to handle the dataLoaded boolean correctly
        getData()
        const interval = setInterval(getData, 5*60*1000)
        setDataLoaded(true)
        return () => clearInterval(interval)
    }, [])

    const chartData = {
        labels: timeConverter(compilationData.timestamp),
        datasets: [
            // {
            //     label: "Windkraft",
            //     borderColor: "#8AB5E1",
            //     backgroundColor: "#8AB5E1",
            //     data: compilationData.wind,
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
            //     label: "Biomasse",
            //     borderColor: "#92D050",
            //     backgroundColor: "#92D050",
            //     data: compilationData.biogas,
            // },
            // {
            //     label: "Geothermie",
            //     borderColor: "#7A1C1C",
            //     backgroundColor: "#7A1C1C",
            //     data: compilationData.geothermie,
            // },
            {
                label: "Graustrom",
                borderColor: "#515151",
                backgroundColor: "#515151",
                data: compilationData.graustrom,
            },
        ],
    };
    const chartOptions = {
        responsive: true,
        animation: {
            duration: 50,
            easing: "linear",
        },
        title: {
            display: true,
            text: "Zusammensetzung des Verbrauchs nach Energieträger innerhalb der letzten " + NUMBER_OF_TXN_COMPILATION/4 + " Stunden",
        },
        tooltips: {
            mode: "index",
            filter: function (tooltipItem,data) {
                var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                if (value == 0) {
                    return false;
                } else {
                    return true;
                }
            }
        },
        hover: {
            mode: "index"
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
                        labelString: "Verbrauch in kW",
                    },
                },
            ],
        },
    };

    return (
        <>
        {dataLoaded ?
            <div className={"consumption-grid-container"}>
                <CurrentConsumption className={"current-consumption"} data={consumptionData.currentConsumption.consumption}/>
                <MeterReading className={"meter-reading"} data={consumptionData.totalConsumption} date={consumptionData.timestamp * 1000}/>
                <AverageConsumption className={"average-consumption"} data={consumptionData.averageConsumption}/>
                <AverageElectricityShare className={"average-electricity-share"}
                                         day={generatePieData(averageData.averageConsumption["1d"], labels, backgroundColors)}
                                         week={generatePieData(averageData.averageConsumption["7d"], labels, backgroundColors)}
                                         month={generatePieData(averageData.averageConsumption["30d"], labels, backgroundColors)}
                                         year={generatePieData(averageData.averageConsumption["365d"], labels, backgroundColors)}/>
                <Chart className={"chart"} data={chartData} options={chartOptions}/>
            </div>
            :
            <WindMillLoading size = "large" color = "#23272A"/>
        }
        </>
    )
}

export default Consumption
