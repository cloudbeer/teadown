import * as React from "react";
import * as ReactDOM from "react-dom";

import { Grid, Icon, Popup, Modal, Button, Header, Form, Input, Divider, Select, Radio } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import "./assets/styles/layout.less";

/** codemirror -------------------*/
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
import "codemirror/theme/neo.css";
import "codemirror/theme/night.css";
import "codemirror/theme/elegant.css";
import "codemirror/theme/erlang-dark.css";
import "codemirror/theme/twilight.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/dracula.css";

/** codemirror ------------ */


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

import { findNode } from "../teadown-tree";

import { ipcRenderer } from "electron";

const mermaid = require("mermaid");
const echarts = require('echarts');
const i18n = require("./i18n/");

let lang = i18n.en;

class TeadownLayout extends React.Component {

    constructor(props) {
        super(props);

        const myLang = navigator.language;
        if (myLang && i18n.hasOwnProperty(myLang.toLowerCase())) {
            Object.assign(lang, i18n[myLang.toLowerCase()]);
        }
        this.state = {
            settings: {
                docRoot: "",
                autoSaveInteval: 2,
                editorKeymap: "default",
                editorTheme: "default"
            },
            height: "",
            treeFiles: {},
            plainFiles: [],
            showStyle: 5,
            source: "",
            htmlData: `<div style="padding:20px;font-size:20px">
            ${lang.CT_Welcome}
            </div>`,
            settingsOpen: false,
            cursor: null,
            lineWrapping: false,
            newFileName: "",
            newFolderName: "",
            currentPath: ""
        };



        // this.maxId = 0;
        this.srcChanged = false;
        this.srcTypeStoped = true; //when you stop type, code will save.
        this.getColWidth.bind(this);
        this.onSettingChanged.bind(this);
        this.onInputValueChanged.bind(this);

        this.autoSave.bind(this)();

        // this.currentCursor = null;

        // this.docRoot = null;
        this.currentFile = null;
        this.timerTypeCheck = null; //record previous timeout timer

        ipcRenderer.send("reqSettings");
        ipcRenderer.on('resSettings', (evt, arg) => {
            let settings = Object.assign(this.state.settings, arg);
            this.setState({ settings });
        });

        ipcRenderer.send('reqFiles');
        ipcRenderer.on("resFiles", (evt, arg) => {
            arg.treeFiles.toggled = true;
            if (this.state.cursor) { this.state.cursor.active = false; }
            if (arg.currentPath) {
                arg.cursor = findNode(arg.treeFiles, arg.currentPath);
                if (arg.currentPath.endsWith(".md")) {
                    ipcRenderer.send('reqDocRead', arg.currentPath);
                }
            }
            this.setState(arg);
        });

        ipcRenderer.on("resDocRead", (evt, arg) => {
            let upState = {};
            if (arg.source) {
                upState.source = arg.source;
            }
            if (arg.htmlData) {
                upState.htmlData = arg.htmlData;
            }
            // upState.cursor = this.currentCursor;
            this.setState(upState);
        });

        // ipcRenderer.on("resFolderChoose", (evt, arg) => {
        //     let settings = this.state.settings;
        //     console.log("resFolderChoose:", arg);
        //     settings.docRoot = arg;
        //     this.setState({ settings: settings });
        // });
        // ipcRenderer.on("resCurrentPath", (evt, arg) => {
        //     const thisNode = findNode()
        //     console.log(arg);
        // });

    }

    autoSave() {
        const timerSaveCheck = setInterval(() => {
            if (this.srcChanged && this.srcTypeStoped) {
                this.srcChanged = false;
                ipcRenderer.send("reqDocSave", this.state.source);
            }
        }, 300);
    }

    getColWidth() {
        switch (this.state.showStyle) {
            case 0:
                return [0, 0, 0];
            case 1:
                return [16, 0, 0];
            case 2:
                return [0, 16, 0];
            case 3:
                return [6, 10, 0];
            case 4:
                return [0, 0, 16];
            case 5:
                return [6, 0, 10];
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
    toggleLineNumber() {
        this.setState({ lineNumber: !this.state.lineNumber });
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
    onAddMdClick(evt) {
        let fdName = this.state.newFolderName;
        let mdName = this.state.newFileName;
        let rootName = this.state.currentPath;
        if (rootName.lastIndexOf('.md') > 0) {
            rootName = rootName.substr(0, rootName.lastIndexOf("/"));
        }
        ipcRenderer.send("reqCreateFile", {
            mdName, fdName, rootName
        });
        this.setState({ newFileName: "", newFolderName: "" })
    }
    onSettingChanged(k, v) {
        let settings = this.state.settings;
        settings[k] = v;
        if (k === "autoSaveInteval") {
            v = parseInt(v) || 4;
        }
        this.setState({ settings: settings });
    }
    onInputValueChanged(key, val) {
        const obj = {};
        obj[key] = val;
        this.setState(obj);
    }
    onSettingsSave() {
        ipcRenderer.send("onSettingChanged", this.state.settings);
        this.setState({ settingsOpen: false });
    }
    onSettingsClose() {
        this.setState({ settingsOpen: false });
    }
    onBrowseFolderClick() {
        ipcRenderer.send("reqFolderChoose");
    }
    onDocToggle(node, toggled) {
        if (this.state.cursor) { this.state.cursor.active = false; }
        node.active = true;
        if (node.children) { node.toggled = toggled; }
        // this.currentCursor = node;
        this.setState({ currentPath: node.path, cursor: node });
        // if (node.type === "directory") {
        //     this.setState({ cursor: node });
        //     this.currentFolder = node;
        //     return;
        // }
        if (node.type === "file" && node.extension === ".md") {
            // this.currentCursor = node;
            ipcRenderer.send('reqDocRead', node.path);
        }
    }
    onDeleteFile() {
        // const dPath = this.currentCursor.path;
        // const dType = this.currentCursor.type;
        const dPath = this.state.currentPath;
        ipcRenderer.send("reqDeleteFile", { dPath });
    }
    render() {
        const highlight = "olive", normalCl = "black";
        const listIconColor = (this.state.showStyle & 1) === 1 ? highlight : normalCl;
        const editorIconColor = (this.state.showStyle & 2) === 2 ? highlight : normalCl;
        const browserIconColor = (this.state.showStyle & 4) === 4 ? highlight : normalCl;
        const editorThemes = [
            { key: 'default', value: 'default', text: lang.LB_Default + ' - ' + lang.LB_Light, icon: 'teadown light' },
            { key: 'twilight', value: 'twilight', text: 'twilight - ' + lang.LB_Dark, icon: 'teadown dark' },
            { key: 'elegant', value: 'elegant', text: 'elegant - ' + lang.LB_Light, icon: 'teadown light' },
            { key: 'erlang-dark', value: 'erlang-dark', text: 'erlang - ' + lang.LB_Dark, icon: 'teadown dark' },
            { key: 'neo', value: 'neo', text: 'neo - ' + lang.LB_Light, icon: 'teadown light' },
            { key: 'night', value: 'night', text: 'night - ' + lang.LB_Dark, icon: 'teadown dark' },
            { key: 'eclipse', value: 'eclipse', text: 'eclipse - ' + lang.LB_Light, icon: 'teadown light' },
            { key: 'dracula', value: 'dracula', text: 'dracula - ' + lang.LB_Dark, icon: 'teadown dark' },
        ];
        const keyboardSchema = [
            { key: 'default', value: 'default', text: lang.LB_Default, icon: 'teadown default' },
            { key: 'sublime', value: 'sublime', text: 'sublime', icon: 'teadown sublime' },
            { key: 'vim', value: 'vim', text: 'vim', icon: 'teadown vim' },
            { key: 'emacs', value: 'emacs', text: 'emacs', icon: 'teadown emacs' }
        ];
        let createdFolder = this.state.currentPath || this.state.settings.docRoot;
        if (createdFolder && createdFolder.lastIndexOf('.md') > 0) {
            createdFolder = createdFolder.substr(0, createdFolder.lastIndexOf("/"));
        }
        // if (this.state.cursor) {
        //     if (this.state.cursor.type === "file") {
        //         createdFolder = this.state.cursor.path;
        //         createdFolder = createdFolder.substr(0, createdFolder.lastIndexOf("/"));
        //     } else {
        //         createdFolder = this.state.cursor.path;
        //     }
        // };
        //  console.log(this.state.settings);

        return <Grid>
            <Grid.Row className="teadown-header">
                <Grid.Column width={8} >
                    <Icon name="tea teadown" className="logo" color="green" />
                    <span> teadown</span>
                </Grid.Column>
                <Grid.Column textAlign="right" width={8} className="toolbar">
                    <Popup basic flowing hoverable
                        trigger={<Icon name="file outline" />}>
                        <Header as="h4">{lang.TT_CreateFile}</Header>
                        <div>@{createdFolder}/</div>
                        <Form>
                            <Form.Input placeholder={lang.TT_NewFolder}
                                value={this.state.newFolderName}
                                onChange={(evt, val) => { this.onInputValueChanged("newFolderName", val.value) }} />
                            <Form.Input placeholder={lang.TT_NewFile}
                                value={this.state.newFileName}
                                onChange={(evt, val) => { this.onInputValueChanged("newFileName", val.value) }} />
                            <Form.Button onClick={this.onAddMdClick.bind(this)}>{lang.LB_Create}</Form.Button>
                        </Form>
                    </Popup>
                    {
                        (this.state.settings.docRoot !== this.state.currentPath) ?
                            <Popup content={lang.LB_Delete} basic
                                trigger={<Icon name="trash" onClick={this.onDeleteFile.bind(this)} />} /> : null
                    }
                    {
                        (this.state.currentPath && this.state.currentPath.lastIndexOf(".md") > 0) ?
                            <Popup content="Export PDF" basic
                                trigger={<Icon name="file pdf outline" />} /> : null
                    }
                    <span className="teadown-splitter">|</span>
                    <Popup content={lang.TP_LineWrappingToggle} basic
                        trigger={<Icon name="teadown wrap" color={this.state.lineWrapping ? "olive" : "black"} onClick={this.toggleLineWrap.bind(this)} />} />
                    <Popup content={lang.TP_LineNumberToggle} basic
                        trigger={<Icon name="ordered list" color={this.state.lineNumber ? "olive" : "black"} onClick={this.toggleLineNumber.bind(this)} />} />
                    <span className="teadown-splitter">|</span>
                    <Popup content={lang.TP_FileListToggle} basic
                        trigger={<Icon name="list" color={listIconColor} onClick={this.toggleList.bind(this)} />} />
                    {
                        this.state.currentPath.lastIndexOf(".md") > 0 ?
                            <Popup content={lang.TP_EditorToggle} basic
                                trigger={<Icon name="edit" color={editorIconColor} onClick={this.toggleEditor.bind(this)} />} /> : null
                    }
                    <Popup content={lang.TP_PreviewerToggle} basic
                        trigger={<Icon name="chrome" loading={browserIconColor === highlight} color={browserIconColor} onClick={this.togglePreviewer.bind(this)} />} />
                    <span className="teadown-splitter">|</span>
                    <Popup content={lang.LB_Settings} basic
                        trigger={<Icon name="settings"
                            onClick={() => { this.setState({ settingsOpen: true }) }} />} />
                    <Popup content={lang.LB_Help} basic
                        trigger={<Icon name="github alternate" onClick={()=>{window.open("https://github.com/cloudbeer/teadown")}} />} />

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
                            data={this.state.treeFiles}
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
                        value={this.state.source || " "}
                        onValueChange={this.onSrcChange.bind(this)}
                        className="teadown-editor"
                        options={{
                            theme: this.state.settings.editorTheme || "default",
                            keyMap: this.state.settings.editorKeymap || "default",
                            mode: "markdown",
                            lineNumbers: this.state.lineNumber,
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
                        dangerouslySetInnerHTML={{ __html: this.state.htmlData || " " }}></div>
                </Grid.Column> : null
                }
            </Grid.Row>
            <Modal dimmer="blurring" open={this.state.settingsOpen} onClose={this.onSettingsClose.bind(this)}>
                <Modal.Header>{lang.LB_Settings}</Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        <Form>
                            <Header>{lang.LB_System}</Header>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>{lang.LB_MDFolder}</label>
                                    <Input value={this.state.settings.docRoot}
                                        icon={<Icon onClick={this.onBrowseFolderClick.bind(this)} name='search' inverted circular link />} />
                                </Form.Field>
                                <Form.Field>
                                    <label>{lang.LB_AutoSaveLabel}</label>
                                    <Input value={this.state.settings.autoSaveInteval}
                                        label={{ icon: 'clock' }}
                                        onChange={(evt, val) => { this.onSettingChanged("autoSaveInteval", val.value) }} />
                                </Form.Field>
                            </Form.Group>
                            <Header>{lang.LB_Editor}</Header>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>{lang.LB_KeyMap}</label>
                                    <Select placeholder='Select editor keymap'
                                        value={this.state.settings.editorKeymap || "default"}
                                        options={keyboardSchema} onChange={(evt, val) => {
                                            this.onSettingChanged("editorKeymap", val.value);
                                        }} />
                                </Form.Field>
                                <Form.Field>
                                    <label>{lang.LB_Theme}</label>
                                    <Select placeholder='Select editor theme'
                                        value={this.state.settings.editorTheme || "default"}
                                        options={editorThemes} onChange={(evt, val) => {
                                            this.onSettingChanged("editorTheme", val.value);
                                        }} />
                                </Form.Field>
                            </Form.Group>
                            {/* <Header>Previewer</Header>
                            <Form.Group widths='equal'>
                                <Form.Field>
                                    <label>Theme</label>
                                    <Input placeholder='Theme' />
                                </Form.Field>
                                <Form.Field>
                                    <label>Background</label>
                                    <Input placeholder='Document folder' />
                                </Form.Field>
                            </Form.Group> */}
                        </Form>
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='black' onClick={this.onSettingsClose.bind(this)}>{lang.LB_Cancel}</Button>
                    <Button positive icon='save' labelPosition='right' content={lang.LB_Save} onClick={this.onSettingsSave.bind(this)} />
                </Modal.Actions>
            </Modal>
        </Grid>
    }
}

ReactDOM.render(
    <TeadownLayout />, document.getElementById("wrapper"));
