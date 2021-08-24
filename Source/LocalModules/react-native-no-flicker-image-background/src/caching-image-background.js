import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ImageBackground } from "react-native";

const cachedSources = new Set([]);

class CachingImageBackground extends PureComponent {
  onSourceLoadedInCache = () => {
    const { source, onSourceLoaded } = this.props;
    if (!cachedSources.has(source)) {
      cachedSources.add(source);
      onSourceLoaded();
    }
  };

  componentDidUpdate() {
    const { source, onSourceLoaded } = this.props;
    if (cachedSources.has(source)) {
      onSourceLoaded();
    }
  }

  render() {
    return <ImageBackground {...this.props} onLoad={this.onSourceLoadedInCache} />;
  }
}

CachingImageBackground.propTypes = {
  ...ImageBackground.propTypes,
  onSourceLoaded: PropTypes.func.isRequired,
};
CachingImageBackground.defaultProps = {};

export { CachingImageBackground };
