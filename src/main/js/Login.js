import React from 'react';
import PropTypes from 'prop-types';


export default function Login({errorMap, fieldChangeEvent, fieldBlurEvent, buttonClick}) {

  let items = [];
  let formId = "login-form";

  return (
    <div id="detailArea">
      <h1 className="page-header">Welcome to Heracles !</h1>
      <hr></hr>
      <p>Please enter password.</p>
      <p>Must be 8 characters long.</p>
      <p>Must contain numbers and letters</p>
      <p>Must contain Uppercase letters</p>
    </div>

  );
}

Login.propTypes = {
errorMap: PropTypes.object,
fieldChangeEvent: PropTypes.func,
fieldBlurEvent: PropTypes.func,
buttonClick: PropTypes.func
};
