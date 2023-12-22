import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "./map.css";
import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import { WindMillLoading } from "react-loadingg";

import windkraftIcon from "../../../resources/windkraftlogo.png";
import wasserkraftIcon from "../../../resources/wasserkraftlogo.png";
// import photovoltaikIcon from "../../../resources/photovoltaiklogo.png";
// import biogasIcon from "../../../resources/biogaslogo.svg";
// import geothermieIcon from "../../../resources/geothermielogo.svg";

// Icons der Grünstromarten und deren initiale Größe festlegen
const windkraftPin = () => {
  return new L.Icon({
    iconUrl: windkraftIcon,
    iconSize: new L.Point(40, 40),
    className: "windkraftPin",
  });
};

const wasserkraftPin = () => {
  return new L.Icon({
    iconUrl: wasserkraftIcon,
    iconSize: new L.Point(40, 40),
    className: "wasserkraftPin",
  });
};

/* const photovoltaikPin = () => {return  new L.Icon({
  iconUrl: photovoltaikIcon,
  iconSize: new L.Point(40, 40),
  className: "photovoltaikPin",
});}

const biogasPin = () => {return  new L.Icon({
  iconUrl: biogasIcon,
  iconSize: new L.Point(40, 40),
  className: "biogasPin",
});}

const geothermiePin = () => {return new L.Icon({
  iconUrl: geothermieIcon,
  iconSize: new L.Point(40, 40),
  className: "geothermiePin",
});} */

function MyComponent() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [cps, setCPS] = useState([0, 0]);
  const map = useMap();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
    // to prevent warning 'missing dependency: dataLoaded':
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function success(pos) {
    setCPS([pos.coords.latitude, pos.coords.longitude]);
    map.setView([pos.coords.latitude, pos.coords.longitude]);
    console.log(cps);
    setDataLoaded(true);
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  // Optimierte Verbrauchsdaten aggregiert auf 24h Basis pro Energieträger für einen Verbraucher

  const optimizedConsumptionData = {
    id_consumer: 1,
    total_optimized_consumption: 100,
    timestamp: Date.now(),
    optimizedData : [
      {
        id_asset: 12345,
        type_asset: "windkraft",
        position: [
          50, 10
        ],
        consumption: 80
      },
      {
        id_asset: 67890,
        type_asset: "wasserkraft",
        position: [
          51, 11
        ],
        consumption: 20
      }
    ]
  }

  function pinSelector(type) {
    switch (type) {
      case "windkraft":
        return windkraftPin();
      case "wasserkraft":
        return wasserkraftPin();
      /*       case "photovoltaik":
        return photovoltaikPin();
        case "biogas":
          return biogasPin();
      case "geothermie":
        return geothermiePin(); */
      default:
    }
  }
  
  function getSize() {
    const sizeProportions = [];
    optimizedConsumptionData.optimizedData.forEach( (el) => {
        let size = el.consumption/optimizedConsumptionData.total_optimized_consumption *40
        sizeProportions.push(size)
    })
    
    return sizeProportions
/*     if (30 > ((production/sum) * 100)){
      return 30
    }
    return ((production/sum) * 100) */
    }

  function pinRenderer() {
    return optimizedConsumptionData.optimizedData.map((el, index) => {
      let pinPupu = pinSelector(el.type_asset);
          pinPupu.options.iconSize = { x : getSize(el), y : getSize(el)}
          return (
        <div>
          <Marker
            style={{ width: "200px" }}
            position={el.position}
            icon={pinPupu}
            key={`pin-${index}`}
          ></Marker>
        </div>
      );
      return;
    });
  }

  return (
    <div>
      {dataLoaded ? (
        <div>
          {pinRenderer()}
          <Marker position={cps}>
            <Popup> Ihr Zuhause </Popup>
          </Marker>
        </div>
      ) : (
        <div>
          {" "}
          <WindMillLoading size="large" color="#23272A" />
        </div>
      )}
    </div>
  );
}

function App() {
  let position = [52.520008, 13.404954];
  return (
    <div className="App" style={{ /* height: "100%", */ maxWidth: "1200px" }}>
      <Container
        style={{
          paddingLeft: "40px",
          paddingTop: "20px",
          margin: "unset",
        }}
      >
        <MapContainer center={position} zoom={8} scrollWheelZoom={true}>
          <MyComponent />
          <TileLayer
            style={{ width: "100%" }}
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/*         <Marker position={position}>
          <Popup>  A pretty CSS3 popup. <br /> Easily customizable. </Popup>
        </Marker> */}
        </MapContainer>
      </Container>
    </div>
  );
}

export default App;
