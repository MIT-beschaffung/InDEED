import { Card } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import "./styles.css";

const  DrawLineChart = (props) => {
    return (
        <div>
            <Line data={props.data} options={props.options} />
        </div>
    );
}

const Chart = (props) => {
    return (
        <Card className={props.className}>
            <Card.Title className="text-left" style={{color: "#3C8761", margin: "10px"}}>
                Verbrauchshistorie
            </Card.Title>
            <Card.Body className="text-left">
                <Line data={props.data} options={props.options}/>
            </Card.Body>
        </Card>
    );
}

export default Chart;
