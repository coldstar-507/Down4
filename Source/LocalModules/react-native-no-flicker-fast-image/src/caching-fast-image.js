import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import FastImage from 'react-native-fast-image';

const cachedSources = new Set([]);

class CachingFastImage extends PureComponent {
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
    return <FastImage {...this.props} onLoad={this.onSourceLoadedInCache} />;
  }
}

CachingFastImage.propTypes = {
  ...FastImage.propTypes,
  onSourceLoaded: PropTypes.func.isRequired,
};
CachingFastImage.defaultProps = {};

export { CachingFastImage };
