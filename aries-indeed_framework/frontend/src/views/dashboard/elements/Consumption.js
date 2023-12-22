// import { Card } from "react-bootstrap";
// import { useState, useEffect } from "react";
// import { Pie } from "react-chartjs-2";
// import Chart from "./modules/Optimization_new";
// import { WindMillLoading } from 'react-loadingg';
// import './consumption.css' //TODO: side effects of css?
// import {
//   getConsumptionDataHelper,
//   getCompilationAverageDataHelper,
//   getCompilationDataHelper
// } from "../../../services/restHandler";

// const labels = {
//   WINDKRAFT: "Windkraft",
//   WASSERKRAFT: "Wasserkraft",
//   PHOTOVOLTAIK: "Photovoltaik",
//   BIOMASSE: "Biomasse",
//   GEOTHERMIE: "Geothermie",
//   FOSSIL: "Fossil"
// }
// const backgroundColors = {
//   LIGHT_BLUE: "#8AB5E1",
//   BLUE: "#356CA5",
//   YELLOW: "#F7D507",
//   GREEN: "#92D050",
//   BROWN: "#7A1C1C",
//   GRAY: "#515151"
// }
// const NUMBER_OF_TXN_COMPILATION = 96 // hier Anzahl der gewünschten Datenpunkte für den Chart eintragen
// const HEIGHT_OF_PIE_CHARTS = 60


// function date2String(unix) {
//   const date = new Date(unix)
//   //TODO: passt minutes return?
//   //TODO: Month einen monat zu klein?
//   return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}, um ${date.getHours()}:${date.getMinutes().toLocaleString('de-DE', {minimumIntegerDigits: 2})} Uhr`
// }

// function round(consumption) {
//   return Math.round(consumption * 100) / 100
// }

// function timeConverter(input) {
//   const timestamp = [];
//   input.map(x =>
//   {
//     const date = new Date(x);
//     const hours = date.getHours();
//     const minutes = "0" + date.getMinutes();

//     const formattedTime = hours + ':' + minutes.substr(-2) + " Uhr";
//     timestamp.push(formattedTime)
//   })
//   return timestamp
// }

// function generatePieData(data, labels, colors) {
//   return  {
//     labels: Object.values(labels),
//     datasets: [
//       {
//         data: Object.values(data),
//         backgroundColor: Object.values(colors),
//       },
//     ]
//   }
// }

// const CurrentConsumption = (props) => {
//   return (
//       <Card className={props.className}>
//         <Card.Title> Aktueller Verbrauch </Card.Title>
//         <Card.Body>
//           <span className={"value"}> { round(props.data) } </span>
//           <span className={"unit"}> kWh </span>
//         </Card.Body>
//       </Card>
//   )
// }

// const MeterReading = (props) => {
//   return (
//       <Card className={props.className}>
//         <Card.Title> Zählerstand </Card.Title>
//         <Card.Body>
//           <div>
//             <label> Gesamtverbrauch: </label>
//             <span className={"value"}> { round(props.data) } </span>
//             <span className={"unit"}> kWh </span>
//           </div>
//           <div>
//             <span className={"info"}> Letzter Stand vom { date2String(props.date) } </span>
//           </div>
//         </Card.Body>
//       </Card>
//   )
// }

// const AverageConsumption = (props) => {
//   return (
//       <Card className={props.className}>
//         <Card.Title> Durchschnittsverbrauch </Card.Title>
//         <Card.Body>
//           <div>
//             <label> Letzte 15 min: </label>
//             <span className={"value"}> {round(props.data["15m"])}</span>
//             <span className={"unit"}> kWh </span>
//           </div>
//           <div>
//             <label> Letzte 1 h: </label>
//             <span className={"value"}> {round(props.data["1h"])}</span>
//             <span className={"unit"}> kWh </span>
//           </div>
//           <div>
//             <label> Letzte 24 h: </label>
//             <span className={"value"}> {round(props.data["24h"])}</span>
//             <span className={"unit"}> kWh </span>
//           </div>
//           <div>
//             <label> Letzte 7 d: </label>
//             <span className={"value"}> {round(props.data["7d"])}</span>
//             <span className={"unit"}> kWh </span>
//           </div>
//           <div>
//             <label> Letzte 30 d: </label>
//             <span className={"value"}> {round(props.data["30d"])}</span>
//             <span className={"unit"}> kWh </span>
//           </div>
//         </Card.Body>
//       </Card>
//   )
// }

// const AverageElectricityShare = (props) => {
//   // Last Pie is 10px bigger due to the legend
//   return (
//       <Card className={props.className} style={{backgroundColor: "#D5EADB"}}>
//         <Card.Title> Durchschnittlicher Stromanteil </Card.Title>
//         <Card.Body>
//           <div>
//             <label> Tag: </label>
//             <Pie data={props.day} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
//           </div>
//           <div>
//             <label> Woche: </label>
//             <Pie data={props.week} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
//           </div>
//           <div>
//             <label> Monat: </label>
//             <Pie data={props.month} options={{ legend: { display: false } }} height={HEIGHT_OF_PIE_CHARTS}/>
//           </div>
//           <div>
//             <label> Jahr: </label>
//             <Pie data={props.year} options={{ legend: { display: true, position: 'bottom'} }} height={HEIGHT_OF_PIE_CHARTS + 10}/>
//           </div>
//         </Card.Body>
//       </Card>
//   )
// }

// const Consumption = () => {

//   const [consumptionData, setConsumptionData] = useState({
//     currentConsumption: {
//       consumption: 0,
//     },
//     timestamp: "",
//     totalConsumption: "",
//     averageConsumption: {
//       "15m": "",
//       "1h": "",
//       "24h": "",
//       "7d": "",
//       "30d": "",
//     },
//     historicConsumption: [{ timestamp: Date.now(), consumption: "" }],
//   })
//   const [averageData, setAverageData] = useState({averageConsumption: {
//       "1d": {
//         wind: 0,
//         wasser: 0,
//         pv: 0,
//         biogas: 0,
//         geothermie: 0,
//         graustrom: 0,
//       },
//       "7d": {
//         wind: 0,
//         wasser: 0,
//         pv: 0,
//         biogas: 0,
//         geothermie: 0,
//         graustrom: 0,
//       },
//       "30d": {
//         wind: 0,
//         wasser: 0,
//         pv: 0,
//         biogas: 0,
//         geothermie: 0,
//         graustrom: 0,
//       },
//       "365d": {
//         wind: 0,
//         wasser: 0,
//         pv: 0,
//         biogas: 0,
//         geothermie: 0,
//         graustrom: 0,
//       },
//     },
//   })
//   const [dataLoaded, setDataLoaded] = useState(false) // counter for useEffects
//   const [compilationData, setCompilationData] = useState({
//     timestamp: [],
//     wind: [],
//     wasser: [],
//     pv: [],
//     biogas: [],
//     geothermie: [],
//     graustrom: [],
//   })

//   const getData = () => {
//     getConsumptionDataHelper().then((res) => {
//       // It takes some uptime until results get returned,
//       // average data will be updated every 15 minutes form the server
//       if(res) setConsumptionData(JSON.parse(res))
//     })

//     getCompilationAverageDataHelper().then((res) => {
//       if (res) setAverageData(JSON.parse(res))
//     })

//     getCompilationDataHelper(NUMBER_OF_TXN_COMPILATION).then(res => {
//       if (res) setCompilationData(JSON.parse(res))
//     });
//   }

//   useEffect(() => {
//     // one use Effect in order to handle the dataLoaded boolean correctly
//     getData()
//     const interval = setInterval(getData, 15*60*1000)
//     setDataLoaded(true)
//     return () => clearInterval(interval)
//   }, [])

//   const chartData = {
//     labels: timeConverter(compilationData.timestamp),
//     datasets: [
//       {
//         label: "Windkraft",
//         borderColor: "#8AB5E1",
//         backgroundColor: "#8AB5E1",
//         data: compilationData.wind,
//       },
//       {
//         label: "Wasserkraft",
//         borderColor: "#356CA5",
//         backgroundColor: "#356CA5",
//         data: compilationData.wasser,
//       },
//       {
//         label: "Photovoltaik",
//         borderColor: "#F7D507",
//         backgroundColor: "#F7D507",
//         data: compilationData.pv,
//       },
//       {
//         label: "Biomasse",
//         borderColor: "#92D050",
//         backgroundColor: "#92D050",
//         data: compilationData.biogas,
//       },
//       {
//         label: "Geothermie",
//         borderColor: "#7A1C1C",
//         backgroundColor: "#7A1C1C",
//         data: compilationData.geothermie,
//       },
//       {
//         label: "Fossil",
//         borderColor: "#515151",
//         backgroundColor: "#515151",
//         data: compilationData.graustrom,
//       },
//     ],
//   };
//   const chartOptions = {
//     responsive: true,
//     animation: {
//       duration: 50,
//       easing: "linear",
//     },
//     title: {
//       display: true,
//       text: "Zusammensetzung des Verbrauchs nach Energieträger innerhalb der letzten " + NUMBER_OF_TXN_COMPILATION/4 + " Stunden",
//     },
//     tooltips: {
//       mode: "index",
//     },
//     hover: {
//       mode: "index",
//     },
//     scales: {
//       xAxes: [
//         {
//           ticks: {
//             reverse: true,
//             autoSkip: true,
//             maxTicksLimit: 24,
//           },
//           scaleLabel: {
//             display: true,
//             labelString: "Uhrzeit",
//           },
//         },
//       ],
//       yAxes: [
//         {
//           stacked: true,
//           scaleLabel: {
//             display: true,
//             labelString: "Verbrauch in kWh",
//           },
//         },
//       ],
//     },
//   };

//   return (
//       <>
//         {dataLoaded ?
//             <div className={"consumption-grid-container"}>
//               <CurrentConsumption className={"current-consumption"} data={consumptionData.currentConsumption.consumption}/>
//               <MeterReading className={"meter-reading"} data={consumptionData.totalConsumption} date={consumptionData.timestamp}/>
//               <AverageConsumption className={"average-consumption"} data={consumptionData.averageConsumption}/>
//               <AverageElectricityShare className={"average-electricity-share"}
//                                        day={generatePieData(averageData.averageConsumption["1d"], labels, backgroundColors)}
//                                        week={generatePieData(averageData.averageConsumption["7d"], labels, backgroundColors)}
//                                        month={generatePieData(averageData.averageConsumption["30d"], labels, backgroundColors)}
//                                        year={generatePieData(averageData.averageConsumption["365d"], labels, backgroundColors)}/>
//               <Chart className={"chart"} data={chartData} options={chartOptions}/>
//             </div>
//             :
//             <WindMillLoading size = "large" color = "#23272A"/>
//         }
//       </>
//   )
// }

// export default Consumption
