import * as React from "react";
import * as ReactDOM from "react-dom";

import {Hello} from "./components/Hello";

import "./assets/styles/layout.css";

ReactDOM.render(
    <section>
        <div className="lost-sidebar">
            <Hello compiler="微soft TypeScript" framework="React"/>
        </div>
        <div className="lost-editor">1</div>
        <div className="lost-preview">2</div>
    </section>,
    document.getElementById("wrapper")
);
