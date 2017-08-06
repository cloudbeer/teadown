import * as React from "react";
import * as ReactDOM from "react-dom";

import {Grid, Image} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import "./assets/styles/layout.less";
import {DocList} from "./components/DocList";

// const {ipcRenderer} = require("electron");
import {ipcRenderer} from "electron";

class TeadownLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            height: "",
            docs: null
        };
    }

    componentWillMount() {
        ipcRenderer.send('threadReading', '');
        ipcRenderer.on("threadReaded", (evt, arg) => {
            this.setState({docs: arg});
        });
        this.setState({
            height: window.innerHeight + 'px'
        });
    }

    render() {
        return <Grid>
            <Grid.Row>
                <Grid.Column
                    key="gList"
                    width={4}
                    className="teadown-container"
                    style={{
                    height: this.state.height
                }}>
                    <DocList docs={this.state.docs}/>
                </Grid.Column>
                <Grid.Column
                    key="gEditor"
                    width={6}
                    color="teal"
                    className="teadown-container"
                    style={{
                    height: this.state.height
                }}>2</Grid.Column>
                <Grid.Column
                    key="gPreviewer"
                    width={6}
                    color="olive"
                    className="teadown-container"
                    style={{
                    height: this.state.height
                }}>3</Grid.Column>
            </Grid.Row>
        </Grid>
    }
}

ReactDOM.render(
    <TeadownLayout/>, document.getElementById("wrapper"));
