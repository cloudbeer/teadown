import * as React from "react";
import * as ReactDOM from "react-dom";

import { Grid, Icon, Popup, Modal, Button, Header, Form, Input, Divider, Select, Radio } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import "./assets/styles/layout.less";

import CodeMirror from 'react-codemirror2'
require('codemirror/mode/markdown/markdown');
require('codemirror/keymap/vim');
require('codemirror/keymap/emacs');
require('codemirror/keymap/sublime');
require('codemirror/addon/selection/active-line');
require('codemirror/addon/edit/closebrackets');
require('codemirror/addon/edit/closetag');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/markdown-fold');
require('codemirror/addon/fold/indent-fold');
require('codemirror/addon/fold/foldgutter');
import "codemirror/addon/fold/foldgutter.css";



import { Treebeard, theme } from 'react-treebeard';
theme.tree.base.backgroundColor = "#fff";
theme.tree.base.color = "#000";
theme.tree.node.header.base.color = "#000";
theme.tree.node.activeLink.background = "#eee";
theme.tree.node.header.title.lineHeight = "2.5em";
theme.tree.node.header.title.whiteSpace = "nowrap";
theme.tree.node.header.title.paddingLeft = "1.5em";
theme.tree.node.toggle.base.position = "absolute";
theme.tree.node.toggle.base.top = "0.4em";



import { ipcRenderer } from "electron";

const mermaid = require("mermaid");
const echarts = require('echarts');

class TeadownLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            settings: {
                docRoot: "",
                autoSaveInteval: 2,
            },
            height: "",
            docs: {},
            showStyle: 5,
            source: "",
            htmlData: `<div style="padding:20px;font-size:20px">
            teadown is a Markdown Editor and Previewer
            </div>`,
            settingsOpen: false,
            cursor: null,
            lineWrapping: false
        };

        this.srcChanged = false;
        this.srcTypeStoped = true; //when you stop type, code will save.
        this.getColWidth.bind(this);
        this.onSettingChanged.bind(this);
        this.autoSave.bind(this)();
        this.currentCursor = null;

        this.timerTypeCheck = null; //record preview timeout timer

        ipcRenderer.send("reqSettings");
        ipcRenderer.on('resSettings', (evt, arg) => {
            this.setState({ settings: arg });
        });

        ipcRenderer.send('threadReading', '');
        ipcRenderer.on("threadReaded", (evt, arg) => {
            arg.toggled = true;
            this.setState({ docs: arg });
        });

        ipcRenderer.on("previewRefreshed", (evt, arg) => {
            let upState = {};
            if (arg.source) {
                upState.source = arg.source;
            }
            if (arg.htmlData) {
                upState.htmlData = arg.htmlData;
            }
            upState.cursor = this.currentCursor;
            this.setState(upState);
        });
        ipcRenderer.on("onFolderChosen", (evt, arg) => {
            let settings = this.state.settings;
            settings.docRoot = arg;
            this.setState({ settings: settings });
        });

    }

    autoSave() {
        const timerSaveCheck = setInterval(() => {
            if (this.srcChanged && this.srcTypeStoped) {
                this.srcChanged = false;
                ipcRenderer.send("docSaving", this.state.source);
            }
        }, 300);
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
                return [0, 9, 7];
            case 7:
                return [3, 7, 6];
            default:
                return [4, 0, 12];
        }
    }

    updateDimensions() {
        this.setState({
            height: window.innerHeight - 34 + 'px'
        });
    }
    loadEcharts() {
        let mycharts = document.getElementsByClassName('echarts');
        for (let chart of mycharts) {
            const content = chart.innerHTML;
            let mychart = echarts.init(chart);
            const myContent = new Function("return " + content)();
            mychart.setOption(myContent);
        }
    }
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions.bind(this));


        mermaid.initialize({
            startOnLoad: true
        });
    }
    componentDidUpdate() {
        mermaid.init({ noteMargin: 10 }, ".mermaid");
        this.loadEcharts.bind(this)();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
    }

    toggleList() {
        let showStyle = ((this.state.showStyle & 1) === 1 ? this.state.showStyle & ~1 : this.state.showStyle | 1);
        this.setState({ showStyle });
    }
    toggleEditor() {
        let showStyle = ((this.state.showStyle & 2) === 2 ? this.state.showStyle & ~2 : this.state.showStyle | 2);
        this.setState({ showStyle });
    }
    togglePreviewer() {
        let showStyle = ((this.state.showStyle & 4) === 4 ? this.state.showStyle & ~4 : this.state.showStyle | 4);
        this.setState({ showStyle });
    }
    toggleLineWrap() {
        this.setState({ lineWrapping: !this.state.lineWrapping });
    }
    onSrcChange(editor, metadata, val) {
        if (this.timerTypeCheck) {
            clearTimeout(this.timerTypeCheck);
        }
        this.timerTypeCheck = setTimeout(() => {
            this.srcTypeStoped = true;
        }, this.state.settings.autoSaveInteval * 1000);
        this.setState({ source: val });
        this.srcChanged = true;
        this.srcTypeStoped = false;
    }
    onSettingChanged(k, v) {
        let settings = this.state.settings;
        settings[k] = v;
        if (k === "autoSaveInteval") {
            v = parseInt(v) || 4;
        }
        this.setState({ settings: settings });
    }

    onSettingsSave() {
        ipcRenderer.send("onSettingChanged", this.state.settings);
        this.setState({ settingsOpen: false });
    }
    onSettingsClose() {
        this.setState({ settingsOpen: false });
    }

    onBrowseFolderClick() {
        ipcRenderer.send("onBrowseFolderClick", "");
    }
    onDocToggle(node, toggled) {
        if (this.state.cursor) { this.state.cursor.active = false; }
        node.active = true;
        if (node.children) { node.toggled = toggled; }
        if (node.type === "directory") {
            this.setState({ cursor: node });
            return;
        }
        if (node.type === "file" && node.extension === ".md") {
            this.currentCursor = node;
            ipcRenderer.send('docReading', node.path);
        }
    }

    render() {
        const highlight = "olive", normalCl = "black";
        const listIconColor = (this.state.showStyle & 1) === 1 ? highlight : normalCl;
        const editorIconColor = (this.state.showStyle & 2) === 2 ? highlight : normalCl;
        const browserIconColor = (this.state.showStyle & 4) === 4 ? highlight : normalCl;
        const editorThemes = [
            { key: 'default', value: 'default', text: 'default - light', icon: 'teadown light' },
            { key: 'elegant', value: 'elegant', text: 'elegant - light', icon: 'teadown light' },
            { key: 'neo', value: 'neo', text: 'neo - light', icon: 'teadown light' },
            { key: 'erlang-dark', value: 'erlang-dark', text: 'erlang - dark', icon: 'teadown dark' },
            { key: 'night', value: 'night', text: 'night - dark', icon: 'teadown dark' },
            { key: 'twilight', value: 'twilight', text: 'twilight - dark', icon: 'teadown dark' },
        ];
        const keyboardSchema = [
            { key: 'default', value: 'default', text: 'default', icon: 'teadown default' },
            { key: 'sublime', value: 'sublime', text: 'sublime', icon: 'teadown sublime' },
            { key: 'vim', value: 'vim', text: 'vim', icon: 'teadown vim' },
            { key: 'emacs', value: 'emacs', text: 'emacs', icon: 'teadown emacs' }
        ];
        return <Grid>
            <Grid.Row className="teadown-header">
                <Grid.Column width={8} >
                    <Icon name="tea teadown" className="logo" color="green" />
                    <span> teadown</span>
                </Grid.Column>
                <Grid.Column textAlign="right" width={8} className="toolbar">
                    <Popup content="New file" basic
                        trigger={<Icon name="add" />} />
                    <Popup content="Delete file" basic
                        trigger={<Icon name="delete" />} />
                    <Popup content="Switch editor line wrapping" basic
                        trigger={<Icon name="teadown wrap" color={this.state.lineWrapping ? "olive" : "black"} onClick={this.toggleLineWrap.bind(this)} />} />
                    <span className="teadown-splitter">|</span>
                    <Popup content="Switch Doc list on/off" basic
                        trigger={<Icon name="list" color={listIconColor} onClick={this.toggleList.bind(this)} />} />
                    {
                        this.currentCursor ?
                            <Popup content="Switch editor on/off" basic
                                trigger={<Icon name="edit" color={editorIconColor} onClick={this.toggleEditor.bind(this)} />} /> : null
                    }
                    <Popup content="Switch preview on/off" basic
                        trigger={<Icon name="chrome" loading={browserIconColor === highlight} color={browserIconColor} onClick={this.togglePreviewer.bind(this)} />} />
                    <span className="teadown-splitter">|</span>
                    <Popup content="Export PDF" basic
                        trigger={<Icon name="file pdf outline" />} />
                    <Popup content="Settings" basic
                        trigger={<Icon name="settings"
                            onClick={() => { this.setState({ settingsOpen: true }) }} />} />
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
                            height: this.state.height,
                            overflow: "auto"
                        }}>
                        <Treebeard
                            style={theme}
                            data={this.state.docs}
                            onToggle={this.onDocToggle.bind(this)}
                        />
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
                    <CodeMirror
                        value={this.state.source}
                        onValueChange={this.onSrcChange.bind(this)}
                        className="teadown-editor"
                        options={{
                            keyMap: "vim",
                            mode: "markdown",
                            lineNumbers: true,
                            lineWrapping: this.state.lineWrapping,
                            matchBrackets: true,
                            autoCloseBrackets: true, autoCloseTags: true,
                            foldGutter: true,
                            styleActiveLine: true,
                            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
                        }} />
                </Grid.Column> : null
                }
                {this.getColWidth()[2] > 0 ? <Grid.Column
                    key="gPreviewer"
                    width={this.getColWidth()[2]}
                    className="teadown-previewer"
                    style={{
                        height: this.state.height,
                        borderLeft: "1px solid #ccc"
                    }}
                >
                    <div className="markdown-body"
                        dangerouslySetInnerHTML={{ __html: this.state.htmlData }}></div>
                </Grid.Column> : null
                }
            </Grid.Row>
            <Modal dimmer="blurring" open={this.state.settingsOpen} onClose={this.onSettingsClose.bind(this)}>
                <Modal.Header>Settings</Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        <Form>
                            <Header>System</Header>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>Document folder</label>
                                    <Input value={this.state.settings.docRoot}
                                        icon={<Icon onClick={this.onBrowseFolderClick.bind(this)} name='search' inverted circular link />} />
                                </Form.Field>
                                <Form.Field>
                                    <label>Auto save after stop type</label>
                                    <Input value={this.state.settings.autoSaveInteval}
                                        label={{ icon: 'clock' }}
                                        onChange={(evt, val) => { this.onSettingChanged("autoSaveInteval", val.value) }} />
                                </Form.Field>
                            </Form.Group>
                            <Header>Editor</Header>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>Keyboard schema</label>
                                    <Select placeholder='Select editor keyboard schema' options={keyboardSchema} />
                                </Form.Field>
                                <Form.Field>
                                    <label>Theme</label>
                                    <Select placeholder='Select editor theme' options={editorThemes} />
                                </Form.Field>
                            </Form.Group>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>Line wrapping</label>
                                    <Radio toggle />
                                </Form.Field>
                                <Form.Field>
                                    <label>Font size</label>
                                    <Input placeholder='Font size' />
                                </Form.Field>
                            </Form.Group>
                            <Header>Previewer</Header>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>Theme</label>
                                    <Input placeholder='Theme' />
                                </Form.Field>
                                <Form.Field>
                                    <label>Background</label>
                                    <Input placeholder='Document folder' />
                                </Form.Field>
                            </Form.Group>
                        </Form>
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='black' onClick={this.onSettingsClose.bind(this)}>Cancel</Button>
                    <Button positive icon='save' labelPosition='right' content="Save" onClick={this.onSettingsSave.bind(this)} />
                </Modal.Actions>
            </Modal>
        </Grid>
    }
}

ReactDOM.render(
    <TeadownLayout />, document.getElementById("wrapper"));
