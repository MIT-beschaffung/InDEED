import Container from "react-bootstrap/Container";
import { useState, useEffect } from "react";
import { WindMillLoading } from 'react-loadingg';


import Chart from "./modules/emission_module";

import { getConsumptionDataHelper } from "../../../services/restHandler";

function App() {


  const dummyData = {
    currentConsumption: 1,
    timestamp: "",
    totalConsumption: 1,
    averageConsumption: {
      "15m": 1,
      "1h": 1,
      "24h": 1,
      "7d": 1,
      "30d": 1,
    },
    historicConsumption: [{ timestamp: Date.now(), consumption: "" }],
  };

  const [consumptionData, setConsumptionData] = useState(dummyData);
  const [dataLoaded, setDataLoaded] = useState(false);

  console.debug(consumptionData);

  useEffect(() => {
    getConsumptionDataHelper().then((res) => {
      console.log("res:");
      console.log(res);
      try {
        setConsumptionData(JSON.parse(res));
        setDataLoaded(true);
      }catch (e) {
        setDataLoaded(false);
      }
    });
  }, []);

 return (
  
    <>

      {dataLoaded ? (
            <Chart  />
      ) : (
          <div> <WindMillLoading size = "large" color = "#23272A" /></div>
      )}
    </>
  );
}

export default App;
