import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "./map.css";
import { useState, useEffect } from "react";
import { WindMillLoading } from "react-loadingg";

import windkraftIcon from "../../../resources/windkraftlogo.png";
import wasserkraftIcon from "../../../resources/wasserkraftlogo.png";
import photovoltaikIcon from "../../../resources/photovoltaiklogo.png";
import biogasIcon from "../../../resources/biogaslogo.svg";
import geothermieIcon from "../../../resources/geothermielogo.svg";
import {getLocation, getOriginDataHelper} from "../../../services/restHandler";
import Button from "react-bootstrap/Button";
import { UncontrolledPopover, PopoverHeader, PopoverBody } from "reactstrap";


const icons = {
    // "windkraft": windkraftIcon,
    "hydro": wasserkraftIcon,
    "solar": photovoltaikIcon,
    // "biogas": biogasIcon,
    // "geothermie": geothermieIcon
}
const MINIMAL_ICON_SIZE = 40
const MAXIMAL_ICON_SIZE = 100

function leafletIcon(iconUrl, iconSize){
    if (iconSize < MINIMAL_ICON_SIZE) iconSize = MINIMAL_ICON_SIZE;
    else if (iconSize > MAXIMAL_ICON_SIZE) iconSize = MAXIMAL_ICON_SIZE;
    return new L.Icon({
            iconUrl: iconUrl,
            iconSize: new L.point(iconSize,iconSize)
        }
    )
}

const MyMarker = (props) => {
    const childProps = { position: props.position }
    if (props.icon) { childProps.icon = props.icon }

    return(
        <Marker {...childProps}>
            {props.content ? <Popup> {props.content} </Popup> : <></>}
        </Marker>
    )
}

const ConsumptionMarkers = (props) => {
    if (props.data === {}) return <></>
    return props.data.map((e) => {
        return <>
                    <MyMarker   position={e.location}
                                content={`${e.consumption} kW`}
                                icon={leafletIcon(icons[e.asset_type], e.consumption / 1000)}
                    />
                    <Polyline positions={[props.cps, e.location]} />
                </>
    });
}

const Map = (props) => {
    const map = useMap();
    map.setView(props.coords)
    return null
}

const Origin = () => {
    const [dataLoaded, setDataLoaded] = useState(false);
    const [cps, setCPS] = useState([52.520008, 13.404954]);
    // Optimierte Verbrauchsdaten aggregiert auf 24h Basis pro Energieträger für einen Verbraucher
    const [originData, setOriginData] = useState([{
        location: [50, 11],
        asset_type: "hydro",
        consumption: 80
    }])

    const getHomeLocation = () => {
        getLocation().then(res => {
            if (res) {
                res = JSON.parse(res)
                setCPS([res.latitude, res.longitude]);
            }
        })
    }

    const getData = () => {
        getOriginDataHelper().then(res => {
            if (res) res = JSON.parse(res)
            if (res.transactions.length > 0) {
                for (const element of res.transactions) {
                    element.location = [element.location.latitude, element.location.longitude]
                }
                setOriginData(res.transactions);
            } else {
                setOriginData([]);
            }
            setDataLoaded(true)
        })
    }

    useEffect(() => {
        // one use Effect in order to handle the dataLoaded boolean correctly
        getHomeLocation();
        getData();
        const interval = setInterval(getData, 5*60*1000)
        setDataLoaded(true)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            {dataLoaded ?
            <>
                <MapContainer style={{margin: "15px", height: "90%"}} center={cps} zoom={8} scrollWheelZoom={true}>
                    <Map coords={cps} />
                    <TileLayer
                        style={{width: "100%"}}
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ConsumptionMarkers data={originData} cps={cps}/>
                    <MyMarker position={cps} content={"Ihr Standort"}/>
                </MapContainer>
                <Button className={'button'} style={{fontFamily: "Avenir Next (Medium)", gridArea: "button1", justifySelf: "end"}}
                        id="PopoverLegacy" type="button">Weitere Informationen</Button>
                    <UncontrolledPopover trigger="legacy" placement="right" target="PopoverLegacy">
                        <PopoverHeader> Weitere Informatinonen </PopoverHeader>
                        <PopoverBody>
                        <div>
                        Auf dieser Seite ist auf einer Karte zu sehen, woher der Grünstromanteil der letzten 5 Minuten zur Deckung Ihres 
                        Stromverbrauchs stammt. Die Geolokation der Erzeugung ist dabei leicht abgeändert, um den Datenschutz der teilnehmenden 
                        Probanden zu gewährleisten. Haben Sie beispielsweise in dem Reiter „Priorisierung“ einen Grünstrommix mit Wasserkraft 
                        priorisiert, sehen Sie in der Karte den Standort des Wasserkraftwerkes, welches Sie im Rahmen des Pilot-Tests bilanziell 
                        mit Strom versorgt. Die Voraussetzung hierfür ist, dass die Stromerzeugung aus Wasserkraft in den vergangenen 5 Minuten 
                        ausreichend hoch war.
                        </div>
                        </PopoverBody>
                    </UncontrolledPopover>
                {/* <div>
                Auf dieser Seite ist auf einer Karte zu sehen, woher der Grünstromanteil der letzten 5 Minuten zur Deckung Ihres 
                Stromverbrauchs stammt. Die Geolokation der Erzeugung ist dabei leicht abgeändert, um den Datenschutz der teilnehmenden 
                Probanden zu gewährleisten. Haben Sie beispielsweise in dem Reiter „Priorisierung“ einen Grünstrommix mit Wasserkraft 
                priorisiert, sehen Sie in der Karte den Standort des Wasserkraftwerkes, welches Sie im Rahmen des Pilot-Tests bilanziell 
                mit Strom versorgt. Die Voraussetzung hierfür ist, dass die Stromerzeugung aus Wasserkraft in den vergangenen 5 Minuten 
                ausreichend hoch war.
                </div> */}
            </>
            :
                <WindMillLoading size="large" color="#23272A" />
            }
        </>
    );
}

export default Origin;
