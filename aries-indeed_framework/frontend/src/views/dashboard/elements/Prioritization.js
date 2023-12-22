import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { UncontrolledPopover, PopoverHeader, PopoverBody } from "reactstrap";
import { Card } from "react-bootstrap";
import ReactBootstrapSlider from "react-bootstrap-slider";

import { sendPrioritizationDataHelper, queryPrioritizationDataHelper } from "../../../services/restHandler";

import "./prioritization.css";
import wasserkraftIcon from "../../../resources/wasserkraftlogo.png";
import photovoltaikIcon from "../../../resources/photovoltaiklogo.png";
import { WindMillLoading } from 'react-loadingg';
import priorisierungsskala from "../../../resources/PrioSkala.png";

const PrioSendButton = (props) => {
    return (
        <Button className="sendButton" onClick={props.onClick}>
            <div>
                Grünstrommix Absenden
            </div>
        </Button>
    )
}

const PrioSlider = (props) => {
    return (
        <>
            <div style={{gridArea: props.gridAreas.counter}} className="prioCounterValue">
                {props.value}
            </div>
            <div style={{gridArea: props.gridAreas.slider}} className="prioSliders" >
                <ReactBootstrapSlider
                    id={props.id}
                    value={props.value}
                    change={props.onChange}
                    step={0.5}
                    max={5}
                    min={1}
                    orientation="vertical"
                    reversed={false}
                />
            </div>
            <div style={{gridArea: props.gridAreas.icon}} className="prioIcon">
                <img src={props.icon}  alt="" />
                <div>{props.label}</div>
            </div>
        </>
    )
}

// to add new sliders create additional grid areas linked to the new sliders
const PrioGrid = (props) => {
    return (
        <div className="grid-container">
            <div className="prioCounter">
                Priorisierung:
            </div>
            <PrioSlider value={props.prioValue.wasser}
                        onChange={props.onChange.wasser}
                        icon={wasserkraftIcon}
                        label={"Wasserkraftanteil"}
                        gridAreas={{counter: "a", slider: "c",  icon: "e"}}
                        id={"prioSliderHydro"}
            />
            <PrioSlider value={props.prioValue.solar}
                        onChange={props.onChange.solar}
                        icon={photovoltaikIcon}
                        label={"Solarstromanteil"}
                        gridAreas={{counter: "a1", slider: "c1",  icon: "e1"}}
                        id={"prioSlidersolar"}
            />
            <div className="prioScaleTextTop">
                Hohe Priorisierung
            </div>
            <div className="prioScale">
                <img style={{ float: "left", height: "240px" }} src={priorisierungsskala} alt="" />
            </div>
            <div className="prioScaleTextBottom">
                Niedrige Priorisierung
            </div>
            <div>
                <PrioSendButton onClick={props.onClick} />
            </div>
            <div>
            <Button className="infoButton" //style={{textAlign: "center", color: "#23272A", fontFamily: "Avenir Next (Medium)"}}
                        id="PopoverLegacy" type="button">Weitere Informationen</Button>
            <UncontrolledPopover trigger="legacy" placement="left" target="PopoverLegacy">
                <PopoverHeader> Weitere Informationen</PopoverHeader>
                <PopoverBody>
                <div>
                Hier können sie eine Priorisierung für den Bezug von Wasserkraft und Solarstrom vorgeben. 
                Sollten Sie bspw. eine hohe Priorisierung von Solarstrom angeben, wird ihr Strombedarf in der Zuordnung von Erzeugung 
                und Verbrauch innerhalb des Pilot-Tests bevorzugt durch Solarstrom gedeckt, sollte dieser verfügbar sein. Nach dem Verschieben der 
                Regler auf die gewünschte Priorisierung, klicken Sie auf den Button „Grünstrommix Absenden“ um die Priorisierung zu aktivieren, 
                sie wird in der nächsten Allokation berücksichtigt. 
                </div>
                </PopoverBody>
            </UncontrolledPopover>
            </div>
        </div>
    )
}

const Prioritization = () => {

    const [loading, setLoading] = useState(true)
    const [solarValue, setSolarValue] = useState(5)
    const [hydroValue, setHydroValue] = useState(5)

    useEffect(() => {
        queryPrioritizationDataHelper().then(response => {
            if(response){
                response = JSON.parse(response)
                setHydroValue(response.wasser)
                setSolarValue(response.solar)
            }
            setLoading(false)
        })
    }, []) // empty deps array so that it is only queried once at the beginning

    const handleOnChangeHydro = ({target}) => { // using event.target
        setHydroValue(target.value)
        setSolarValue(6 - target.value) // balancing may become more complex as the amount of sliders grows
    }

    const handleOnChangeSolar = ({target}) => { // using event.target
        setSolarValue(target.value)
        setHydroValue(6 - target.value) // balancing may become more complex as the amount of sliders grows
    }

    const handleOnClick = () => {
        sendPrioritizationDataHelper({wasser: hydroValue, solar: solarValue}).then(response => {
            if (response.status === 200 || response.status === 201) window.alert("Priorisierung erfolgreich aktualisiert")
            else window.alert("Es ist ein Fehler aufgetreten: " + response.status + ": " + response.statusText)
        })
    }

    return (
        <div>
            { loading ? <WindMillLoading size = "large" color = "#23272A" /> :
            <Card className="prioCard">
                <Card.Title className="text-left" style={{color: "#3C8761", margin: "10px"}}>
                    Priorisierung des Grünstromanteils
                </Card.Title>
                <Card.Body className="text-center" style={{margin: "40px"}}>
                    <PrioGrid prioValue={{wasser: hydroValue, solar: solarValue}}
                              onChange={{wasser: handleOnChangeHydro, solar: handleOnChangeSolar}}
                              onClick={handleOnClick} />
                </Card.Body>
            </Card>
            }
        </div>
    )
}

export default Prioritization;


