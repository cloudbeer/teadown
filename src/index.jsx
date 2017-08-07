import * as React from "react";
import * as ReactDOM from "react-dom";

import { Grid, Image } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import "./assets/styles/layout.less";
import { DocList } from "./components/DocList";
import { Preview } from "./components/Preview";

import { ipcRenderer } from "electron";

class TeadownLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            height: "",
            docs: null,
            showStyle: 5,
            previewUrl: "web/welcome.html"
        };
        this.getColWidth.bind(this);
    }

    getColWidth() {
        switch (this.state.showStyle) {
            case 2:
                return [0, 16, 0];
            case 3:
                return [4, 12, 0];
            case 4:
                return [0, 0, 16];
            case 5:
                return [4, 0, 12];
            case 6:
                return [0, 8, 8];
            case 7:
                return [4, 6, 6];
            default:
                return [4, 0, 12];
        }
    }

    updateDimensions() {
        this.setState({
            height: window.innerHeight + 'px'
        });
    }
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions.bind(this));

        ipcRenderer.send('threadReading', '');
        ipcRenderer.on("threadReaded", (evt, arg) => {
            this.setState({ docs: arg });
        });
        ipcRenderer.on("previewRefreshed", (evt, arg) => {
            this.setState({ previewUrl: arg + "?t=" + 1 * (new Date()) });
        });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
    }

    docListHideHandle() {
        this.setState({ showStyle: this.state.showStyle & ~1 });
    }
    docListShowHandle() {
        this.setState({ showStyle: this.state.showStyle | 1 });
    }
    docEditHandle(){
        this.setState({ showStyle: this.state.showStyle | 2 });
    }

    render() {
        return <Grid>
            <Grid.Row>
                {this.getColWidth()[0] > 0 ?
                    <Grid.Column
                        key="gList"
                        width={this.getColWidth()[0]}
                        className="teadown-container"
                        style={{
                            height: this.state.height,
                            borderRight: "1px solid #ccc"
                        }}>
                        <DocList docs={this.state.docs}
                            onHide={this.docListHideHandle.bind(this)} />
                    </Grid.Column> : null
                }
                {this.getColWidth()[1] > 0 ? <Grid.Column
                    key="gEditor"
                    width={this.getColWidth()[1]}
                    className="teadown-container"
                    style={{
                        height: this.state.height
                    }}>2</Grid.Column> : null
                }
                {this.getColWidth()[2] > 0 ? <Grid.Column
                    key="gPreviewer"
                    width={this.getColWidth()[2]}
                    className="teadown-container"
                    style={{
                        height: this.state.height
                    }}>
                    <Preview previewUrl={this.state.previewUrl}
                        onDocListShow={this.docListShowHandle.bind(this)} 
                        onEdit={this.docEditHandle.bind(this)} />
                </Grid.Column> : null
                }
            </Grid.Row>
        </Grid>
    }
}

ReactDOM.render(
    <TeadownLayout />, document.getElementById("wrapper"));
