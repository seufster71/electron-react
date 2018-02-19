import React, {Component} from 'react';
import { render } from 'react-dom';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import PageContainer from './PageContainer.js';


if (process.env.NODE_ENV !== 'production') {
  console.log('Looks like we are in development mode!');
}



class App extends Component {

  constructor() {
    super();

	}

  render() {
    return (
      <PageContainer />
    );
  }
}


render( <App/>, document.getElementById('app') );
