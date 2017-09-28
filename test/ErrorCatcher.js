import React from "react";

export default class ErrorCatcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    console.error("Caught react error", error, info);
    ErrorCatcher.lastError = "" + error;
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

ErrorCatcher.lastError = "";
ErrorCatcher.getError = function() {
  const res = ErrorCatcher.lastError;
  ErrorCatcher.lastError = "";
  return res;
};
