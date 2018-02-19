import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Login from './Login';
import {encrypt,decrypt} from './Encryption';

import crypto from 'crypto';


export default class PageContainer extends Component {
	constructor(props) {
		super(props);
    this.navigationChange = this.navigationChange.bind(this);
		this.add = this.add.bind(this);
	}

  navigationChange(event) {
    if (event.target.id == 'LOGIN') {
      this.props.actions.navChange({currentPage:'login'});
    }
  }

	add(event) {
		console.log("click add");
		const myCryptKey = crypto.createHmac('sha256','siENFn34783w').update('73fnfisv734e').digest();
		encrypt(myCryptKey,"I love cupcakes");
  }


  render() {
		return(
		<div className="row">
			<div className="col-sm-2 dark1bg">
				<div className="row">
					<div className="col-sm-2 content-search">
						<span>col 1</span>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-2 content-middle">
						<div id="vaultArea"> content </div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-2 text-center bottom-space">
							<span>bottom</span>
					</div>
				</div>
			</div>
			<div className="col-sm-2 dark2bg">
				<div className="row">
					<div className="col-sm-2 content-search">
						<span>col 2</span>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-2 content-middle">
						<div id="groupArea"> content 2</div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-2 text-center bottom-space">
							<span>bottom</span>
					</div>
				</div>
			</div>
			<div className="col-sm-3 dark3bg">
				<div className="row">
					<div className="col-sm-3 content-search">
						<div className="input-group">
							<div className="input-group-btn">
								<input id="recordSearch" className="form-control" placeholder="Search for..."/>
							</div>
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-3 content-middle">
						<div id="recordArea"> content 3</div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-3 text-center bottom-space">
						<button type="button" id="addRecord" className="btn btn-default bottom-space" onClick={this.add} >
							<span className="glyphicon glyphicon-plus" aria-hidden="true"></span> Add
						</button>
					</div>
				</div>
			</div>
			<div className="col-sm-5 dark4bg">
				<div className="row">
					<div className="col-sm-5">
						<div id="statusArea"> status </div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-5 content-middle">
						<Login/>
					</div>
				</div>
				<div className="row">
					<div className="col-xs-5 dark4bg">
						<div className="row">
							<div className="col-xs-6 bottom-space">
								<button type="button" id="encryptionSettings" className="btn btn-default">
									<i className="fa fa-lock"></i> Encryption
								</button>
							</div>
							<div className="col-xs-6 copy-right">
								<span className="glyphicon glyphicon-copyright-mark" aria-hidden="true"></span> 2018 Cborgtech, LLC
							</div>
						</div>
					</div>
				</div>
			</div>
    </div>);
  }
}

PageContainer.propTypes = {
	menus: PropTypes.object,
	lang: PropTypes.string,
	actions: PropTypes.object
};
