import * as React from "react";
import { Grid, List, Icon, } from 'semantic-ui-react'


export class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previewUrl: props.previewUrl
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
  }


  render() {
    return <div style={{ height: "100%" }}>
      <Grid columns={2} className="teadown-header">
        <Grid.Row>
          <Grid.Column>
            <Icon name="arrow circle right" onClick={this.props.onDocListShow}/>
            <Icon name="edit" onClick={this.props.onEdit}/>
            <Icon name="file pdf outline" />
          </Grid.Column>
          <Grid.Column textAlign="right">
            <Icon name="arrow circle left" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <iframe src={this.state.previewUrl} className="teadown-fullwin"></iframe>
    </div>;
  }
}
