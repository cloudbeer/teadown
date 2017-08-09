import * as React from "react";
import {
  Grid,
  List,
  Icon,
  Accordion
} from 'semantic-ui-react'

import { ipcRenderer } from "electron";

export class DocList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      docs: props.docs
    }
  }

  viewDocHandler(path) {
    this.setState({ path: path });
    ipcRenderer.send('docReading', path);
  }
  componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
  }

  render() {
    return <div>
      {
        this.state.docs && this.state.docs.children.map((ele1, idx1) => (
          <Accordion key={idx1}>
            <Accordion.Title key={idx1}>
              <Icon name='book' />
              {ele1.name}
            </Accordion.Title>
            <Accordion.Content>
              <List>
                {
                  ele1.children.map((ele2, idx2) => (
                    <List.Item key={idx2} style={{ padding: "5px 13px" }}
                      className="teadown-link"
                      active={this.state.path === ele2.path}
                      onClick={this.viewDocHandler.bind(this, ele2.path)}>
                      <List.Icon name='file text outline' />
                      <List.Content>
                        {ele2.name}
                      </List.Content>
                    </List.Item>
                  ))
                }
              </List>
            </Accordion.Content>
          </Accordion>
        ))}
    </div>;
  }
}
