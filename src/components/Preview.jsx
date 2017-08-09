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
      <iframe src={this.state.previewUrl} className="teadown-fullwin"></iframe>
    </div>;
  }
}
