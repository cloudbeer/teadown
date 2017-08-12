import * as React from "react";
import * as ReactDOM from "react-dom";

import { Grid, Icon, Popup } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import "./assets/styles/layout.less";
import { DocList } from "./components/DocList";
import { Preview } from "./components/Preview";

import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/markdown';
import 'brace/theme/github';

import { ipcRenderer } from "electron";

class TeadownLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            height: "",
            docs: null,
            showStyle: 5,
            previewUrl: "web/welcome.html",
            source: ""
        };
        this.srcChanged = false;
        this.getColWidth.bind(this);
    }

    getColWidth() {
        switch (this.state.showStyle) {
            case 0:
                return [0, 0, 0];
            case 1:
                return [4, 0, 0];
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
            height: window.innerHeight - 34 + 'px'
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
            this.setState({ previewUrl: arg.url + "?t=" + 1 * (new Date()), source: arg.source });
        });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
    }

    toggleList() {
        let showStyle = ((this.state.showStyle & 1) === 1 ? this.state.showStyle & ~1 : this.state.showStyle | 1);
        // if (showStyle === 1) {
        //     showStyle = 5;
        // };
        this.setState({ showStyle });
    }
    toggleEditor() {
        let showStyle = ((this.state.showStyle & 2) === 2 ? this.state.showStyle & ~2 : this.state.showStyle | 2);
        // if (showStyle === 1) {
        //     showStyle = 5;
        // };
        this.setState({ showStyle });
    }
    togglePreviewer() {
        let showStyle = ((this.state.showStyle & 4) === 4 ? this.state.showStyle & ~4 : this.state.showStyle | 4);
        // if (showStyle === 1) {
        //     showStyle = 5;
        // };
        this.setState({ showStyle });
    }
    onSrcChange(val) {
        this.setState({ source: val });
        this.srcChanged = true;
    }

    render() {
        const highlight = "red", normalCl = "black";
        const listIconColor = (this.state.showStyle & 1) === 1 ? highlight : normalCl;
        const editorIconColor = (this.state.showStyle & 2) === 2 ? highlight : normalCl;
        const browserIconColor = (this.state.showStyle & 4) === 4 ? highlight : normalCl;
        return <Grid>
            <Grid.Row className="teadown-header">
                <Grid.Column width={4} >
                    <Icon name="coffee" size="big" color="green" /> teadown
                </Grid.Column>
                <Grid.Column textAlign="right" width={12} className="toolbar">
                    <Popup content="Switch Doc list on/off" basic
                        trigger={<Icon name="list" color={listIconColor} onClick={this.toggleList.bind(this)} />} />
                    <Popup content="Switch editor on/off" basic
                        trigger={<Icon name="edit" color={editorIconColor} onClick={this.toggleEditor.bind(this)} />} />
                    <Popup content="Switch preview on/off" basic
                        trigger={<Icon name="chrome" loading={browserIconColor === highlight} color={browserIconColor} onClick={this.togglePreviewer.bind(this)} />} />

                    <Popup content="Export PDF" basic
                        trigger={<Icon name="file pdf outline" />} />
                    <Popup content="Settings" basic
                        trigger={<Icon name="settings" />} />
                    <Popup content="Help" basic
                        trigger={<Icon name="help" />} />

                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                {this.getColWidth()[0] > 0 ?
                    <Grid.Column
                        key="gList"
                        width={this.getColWidth()[0]}
                        className="teadown-container"
                        style={{
                            height: this.state.height
                        }}>
                        <DocList docs={this.state.docs} />
                    </Grid.Column> : null
                }
                {this.getColWidth()[1] > 0 ? <Grid.Column
                    key="gEditor"
                    width={this.getColWidth()[1]}
                    className="teadown-container"
                    style={{
                        height: this.state.height,
                        paddingLeft: 0,
                        paddingRight: 0
                    }}>
                    <AceEditor
                        mode="markdown"
                        theme="github"
                        style={{ width: "100%", height: "100%" }}
                        onChange={this.onSrcChange.bind(this)}
                        name="tdEditor"
                        value={this.state.source}
                        editorProps={{ $blockScrolling: true }}
                    />
                </Grid.Column> : null
                }
                {this.getColWidth()[2] > 0 ? <Grid.Column
                    key="gPreviewer"
                    width={this.getColWidth()[2]}
                    className="teadown-container"
                    style={{
                        height: this.state.height,
                        borderLeft: "1px solid #ccc",
                        paddingLeft: 0,
                        paddingRight: 0
                    }}>
                    <Preview previewUrl={this.state.previewUrl} />
                </Grid.Column> : null
                }
            </Grid.Row>
        </Grid>
    }
}

ReactDOM.render(
    <TeadownLayout />, document.getElementById("wrapper"));
