import React, { PureComponent } from "react";
import { StyleSheet, Platform } from "react-native";
import { CachingFastImage } from "./caching-fast-image";
import FastImage from 'react-native-fast-image';


class NoFlickerFastImage extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      source: props.source,
    };
  }

  onSourceLoaded = () => {
    if (this.state.source !== this.props.source) {
      this.setState({
        source: this.props.source,
      });
    }
  };

  render() {
    if (Platform.OS === "ios") {
      return (
        <FastImage {...this.props} />
      );
    }

    return (
      <React.Fragment>
        <CachingFastImage
          {...this.props}
          style={styles.hide}
          onSourceLoaded={this.onSourceLoaded}
        />
        <FastImage
          {...this.props}
          source={this.state.source}
        />
      </React.Fragment>
    );
  }
}

NoFlickerFastImage.propTypes = {
  ...FastImage.propTypes
};

export { NoFlickerFastImage };

const styles = StyleSheet.create({
  hide: {
    display: "none",
  },
});
