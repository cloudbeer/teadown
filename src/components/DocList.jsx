import * as React from "react";
import {
  Grid,
  List,
  Icon,
  Accordion
} from 'semantic-ui-react'

export class DocList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      docs: props.docs
    }
  }
  componentWillReceiveProps(nextProps) {
    console.log(nextProps);
    this.setState(nextProps);
  }

  render() {
    return <div className="doc-list full-h">
      <Grid columns={2} className="teadown-header">
        <Grid.Row>
          <Grid.Column>
            <Icon name="coffee" size="big" color="green" /> teadown
          </Grid.Column>
          <Grid.Column textAlign="right">
            <Icon name="settings" />
            <Icon name="arrow circle left" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <div>
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
                      <List.Item key={idx2} style={{padding:"5px 13px"}}>
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
          ))
        }
      </div>
    </div>;
  }
}
