import React, { PureComponent } from "react";
import { ImageBackground, StyleSheet, Platform } from "react-native";
import { CachingImageBackground } from "./caching-image-background";


class NoFlickerImageBackground extends PureComponent {
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
        <ImageBackground {...this.props}/>
      );
    }

    return (
      <React.Fragment>
        <CachingImageBackground
          {...this.props}
          style={styles.hide}
          onSourceLoaded={this.onSourceLoaded}
        />
        <ImageBackground
          {...this.props}
          source={this.state.source}
        />
      </React.Fragment>
    );
  }
}

NoFlickerImageBackground.propTypes = {
  ...ImageBackground.propTypes
};

export { NoFlickerImageBackground };

const styles = StyleSheet.create({
  hide: {
    display: "none",
  },
});
