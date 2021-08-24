import ViewShot, { captureRef } from 'react-native-view-shot';
import React, { Component } from 'react';
import { Text, View, ImageBackground, TouchableOpacity, TextInput, Dimensions, StyleSheet, FlatList, TouchableWithoutFeedback, Image, ScrollView } from 'react-native';

import { NoFlickerImage } from './LocalModules/react-native-no-flicker-image/index';
import { NoFlickerImageBackground } from './LocalModules/react-native-no-flicker-image-background/index';
import { NoFlickerFastImage } from './Scratch';
// import { Camera, CameraType } from 'react-native-camera-kit';
import { FillToAspectRatio } from './AspectRatioForCamera';
import { RNCamera } from 'react-native-camera';
import FastImage from 'react-native-fast-image';
import ImageResizer from 'react-native-image-resizer';

import { Timer } from './Time'

import RNFS from 'react-native-fs';
import { act } from 'react-test-renderer';

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


const cameraPictureSize = {
    width: Dimensions.get('window').width / 1.5,
    height: Dimensions.get('window').height / 2
};
export const imageSize = { // close to a perfect golden
    height: 322,
    width: 199
};
const actualDimensions = {
    height: Dimensions.get('window').height - 144,
    width: Dimensions.get('window').width - 32 // 2 for the border
};

export class SupG4 extends Component {
    constructor(props) {
        super(props);
        this.loadedImage = new Array(this.props.images.length);
        this.loadedImage.fill(false);
        this.state = {
            index: 0,
        }
        console.log("SupG5 constructed");
        this.running = false;
    }
    run() {
        if (!this.running) {
            this.running = true;
            console.log("Running!");
            this.loopID = setInterval(() => {
                this.setState(prevState => ({ index: (prevState.index + 1) % this.props.images.length }));
            }, 130)
        } else {
            clearInterval(this.loopID);
            this.running = false;
        }
    }
    componentWillUnmount() {
        console.log("Clearing this loop ID:", this.loopID);
        clearInterval(this.loopID);
    }
    allLoaded() {
        return this.loadedImage.every(value => value == true);
    }
    renderItem(item) {
        return (
            <FastImage
                source={{ uri: item.uri }}
                resizeMode={'stretch'}
                style={
                    [{ height: imageSize.height, width: imageSize.width }, !this.allLoaded() ?
                        { opacity: 0 } :
                        this.state.index == item.index ?
                            { opacity: 1 } :
                            { display: 'none' }]
                }
                onLoadEnd={() => {
                    console.log("LOADED:", item.index);
                    this.loadedImage[item.index] = true;
                    if (this.allLoaded()) { console.log("ALL LOADED"); this.forceUpdate(); }
                }}>
            </FastImage>
        )
    }
    render() {
        return (
            <TouchableWithoutFeedback onPress={() => this.run()}>
                <View style={{ height: imageSize.height, width: imageSize.width }}>
                    <FlatList
                        renderItem={({ item }) => this.renderItem(item)}
                        data={this.props.images}
                        initialNumToRender={this.props.images.length}
                        keyExtractor={({ index }) => index}
                    >
                    </FlatList>
                </View>
            </TouchableWithoutFeedback >

        )
    }
}

export class SupG5 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            index: 0,
            running: false
        }
        console.log("SupG5 constructed");
    }
    run() {
        this.setState({ running: true });
        console.log("Running!");
        this.loopID = setInterval(() => {
            this.setState(prevState => ({ index: (prevState.index + 1) % this.props.images.length }));
        }, 150)
    }
    componentWillUnmount() {
        console.log("Clearing this loop ID:", this.loopID);
        clearInterval(this.loopID);
    }
    render() {
        return (
            <TouchableWithoutFeedback onPress={() => {
                if (this.state.running) {
                    clearInterval(this.loopID);
                    this.setState({ running: false });
                } else {
                    this.run();
                }
            }}>
                <NoFlickerImage
                    source={{ uri: this.props.images[this.state.index] }}
                    style={{ height: imageSize.height, width: imageSize.width }}
                />
            </TouchableWithoutFeedback >
        )
    }
}

class SupG7 extends Component {
    constructor(props) {
        super(props);
        this.textInput = '';
        this.viewShot = null;
        console.log("SupG7 constructed!");
    }
    state = {
        decoration: 'Vanilla' // 'Vanilla' | 'Ribbon' | 'Patron' | 'Cinema';
    }
    async shoot() {
        const picUri = await this.viewShot.capture();
        this.props.cb(picUri);
    }
    decoration() {
        console.log("Changing decoration from supg7");
        switch (this.state.decoration) {
            case 'Vanilla':
                this.setState({ decoration: 'Cinema' });
                break;
            case 'Cinema':
                this.setState({ decoration: 'Patron' });
                break;
            case 'Patron':
                this.setState({ decoration: 'Ribbon' });
                break;
            case 'Ribbon':
                this.setState({ decoration: 'Vanilla' });
                break;
        }
    }
    render() {
        return (
            <ViewShot ref={(vs) => this.viewShot = vs} options={{ result: "data-uri", quality: 0.1, format: "jpg" }}>
                <ImageBackground
                    source={{ uri: this.props.image }}
                    style={{ height: actualDimensions.height - 2 }}>
                    <View style={[this.state.decoration == 'Cinema' ? { height: 80, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]} />
                    <View style={[this.state.decoration == 'Cinema' ? { height: actualDimensions.height - 162, width: actualDimensions.width - 2 } : { display: 'none' }]} />
                    <View style={[this.state.decoration == 'Cinema' ? { height: 80, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]} />
                    <View style={[this.state.decoration == 'Patron' ? { height: actualDimensions.height - 102, width: actualDimensions.width - 2 } : { display: 'none' }]}></View>
                    <View style={[this.state.decoration == 'Patron' ? { flex: 0, height: 100, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]}>
                        <TextInput
                            style={[this.state.decoration == 'Patron' ? { flex: 1, fontSize: 20, color: 'white', textAlign: 'center', textAlignVertical: 'center' } : { display: 'none' }]}
                            onChangeText={(text) => this.textInput = text}
                            onEndEditing={() => this.forceUpdate()}
                            multiline={true}>
                            <Text style={[this.state.decoration == 'Patron' ? { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 20, color: 'white' } : { display: 'none' }]}><Text>{this.textInput}</Text></Text>
                        </TextInput>
                    </View>
                    <View style={[this.state.decoration == 'Ribbon' ? { height: ((actualDimensions.height - 2) / 2) - 13, width: actualDimensions.width - 2 } : { display: 'none' }]}></View>
                    <View style={[this.state.decoration == 'Ribbon' ? { flex: 0, height: 26, width: actualDimensions.width - 2, backgroundColor: 'rgba(0,0,0,0.5)' } : { display: 'none' }]}>
                        <TextInput
                            style={[this.state.decoration == 'Ribbon' ? { flex: 1, fontSize: 12, color: 'white', padding: 4, textAlignVertical: 'center', textAlign: 'center' } : { display: 'none' }]}
                            onChangeText={(text) => this.textInput = text}
                            onEndEditing={() => this.forceUpdate()}
                            multiline={false}>
                            <Text style={[this.state.decoration == 'Ribbon' ? {} : { display: 'none' }]}><Text>{this.textInput}</Text></Text>
                        </TextInput>
                    </View>
                </ImageBackground>
            </ViewShot>
        )
    }
}

class SupG9 extends Component {
    constructor(props) {
        super(props);
        this.tmpLoop = [];
        this.pictureLoop = [];
        this.viewShot = null;
        this.textInput = '';
        this.running = false;
        this.state = {
            index: 0,
            decoration: 'Vanilla', // 'Vanilla' | 'Ribbon' | 'Patron' | 'Cinema';
            shooting: false
        }
        console.log("SupG6 constructed");
    }
    decoration() {
        console.log("Pre-decoration() state:", this.state);
        switch (this.state.decoration) {
            case 'Vanilla':
                this.setState({ decoration: 'Cinema' });
                break;
            case 'Cinema':
                this.setState({ decoration: 'Patron' });
                break;
            case 'Patron':
                this.setState({ decoration: 'Ribbon' });
                break;
            case 'Ribbon':
                this.setState({ decoration: 'Vanilla' });
                break;
        }
    }
    run() {
        if (this.running) {
            this.running = false;
            console.log("Clearing loop:", this.loopID);
            clearInterval(this.loopID);
        } else {
            this.running = true;
            this.loopID = setInterval(() => {
                this.setState(prevState => ({ index: (prevState.index + 1) % this.props.images.length }));
            }, 150);
            console.log("Running on loop:", this.loopID);
        }
    }
    componentWillUnmount() {
        console.log("Clearing this loop ID:", this.loopID);
        clearInterval(this.loopID);
    }
    shoot() {
        if (this.running) {
            clearInterval(this.loopID);
            this.running = false;
        }
        this.setState({ shooting: true, index: 0 });
    }
    async processLoop(theLoop, index) {
        if (theLoop.length > 0) {
            console.log("theLoop size:", theLoop.length)
            var resizedImage = await ImageResizer.createResizedImage(theLoop[0], imageSize.width, imageSize.height, 'JPEG', 75);
            console.log("Resized image number:", index, "--->", resizedImage);
            var base64resizedImage = await RNFS.readFile(resizedImage.path, 'base64');
            this.pictureLoop.push({ uri: 'data:image/jpeg;base64,' + base64resizedImage, index: index });
            index++;
            theLoop.shift();
            this.processLoop(theLoop, index);
        } else {
            console.log("Done processing the loop!");
            this.props.cb({ photoLoop: this.pictureLoop });
        }
    }
    stopNext() {
        if (this.state.index + 1 == this.props.images.length) {
            console.log("Done shooting!");
            this.processLoop(this.tmpLoop, 0);
        } else {
            this.setState({ index: this.state.index + 1 });
        }
    }
    render() {
        if (this.state.shooting) {
            return (
                <ViewShot ref={(vs) => { this.viewShot = vs; console.log("LOOPVIEWSHOT UPDATED!"); }} options={{ result: "data-uri", quality: 0.5, format: "jpg" }}>
                    <ImageBackground
                        source={{ uri: this.props.images[this.state.index] }}
                        style={{ height: actualDimensions.height - 2, width: actualDimensions.width - 2 }}
                        onLoadEnd={async () => {
                            var uri = await this.viewShot.capture();
                            this.tmpLoop.push(uri);
                            console.log(this.state.index + 1, "out of", this.props.images.length);
                            this.stopNext();
                        }}>
                        <View style={[this.state.decoration == 'Cinema' ? { height: 80, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]} />
                        <View style={[this.state.decoration == 'Cinema' ? { height: actualDimensions.height - 162, width: actualDimensions.width - 2 } : { display: 'none' }]} />
                        <View style={[this.state.decoration == 'Cinema' ? { height: 80, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]} />
                        <View style={[this.state.decoration == 'Patron' ? { height: actualDimensions.height - 102, width: actualDimensions.width - 2 } : { display: 'none' }]}></View>
                        <View style={[this.state.decoration == 'Patron' ? { flex: 0, height: 100, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]}>
                            <TextInput
                                style={[this.state.decoration == 'Patron' ? { flex: 1, fontSize: 20, color: 'white', textAlign: 'center', textAlignVertical: 'center' } : { display: 'none' }]}
                                onChangeText={(text) => this.textInput = text}
                                onEndEditing={() => this.forceUpdate()}
                                multiline={true}>
                                <Text style={[this.state.decoration == 'Patron' ? { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 20, color: 'white' } : { display: 'none' }]}><Text>{this.textInput}</Text></Text>
                            </TextInput>
                        </View>
                        <View style={[this.state.decoration == 'Ribbon' ? { height: ((actualDimensions.height - 2) / 2) - 13, width: actualDimensions.width - 2 } : { display: 'none' }]}></View>
                        <View style={[this.state.decoration == 'Ribbon' ? { flex: 0, height: 26, width: actualDimensions.width - 2, backgroundColor: 'rgba(0,0,0,0.5)' } : { display: 'none' }]}>
                            <TextInput
                                style={[this.state.decoration == 'Ribbon' ? { flex: 1, fontSize: 12, color: 'white', padding: 4, textAlignVertical: 'center', textAlign: 'center' } : { display: 'none' }]}
                                onChangeText={(text) => this.textInput = text}
                                onEndEditing={() => this.forceUpdate()}
                                multiline={true}>
                                <Text style={[this.state.decoration == 'Ribbon' ? {} : { display: 'none' }]}><Text>{this.textInput}</Text></Text>
                            </TextInput>
                        </View>
                    </ImageBackground>
                </ViewShot >

            )
        } else {
            return (
                <TouchableWithoutFeedback
                    onPress={() => this.run()}>
                    <NoFlickerImageBackground
                        source={{ uri: this.props.images[this.state.index] }}
                        style={{ height: actualDimensions.height - 2 }} >
                        <View style={[this.state.decoration == 'Cinema' ? { height: 80, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]} />
                        <View style={[this.state.decoration == 'Cinema' ? { height: actualDimensions.height - 162, width: actualDimensions.width - 2 } : { display: 'none' }]} />
                        <View style={[this.state.decoration == 'Cinema' ? { height: 80, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]} />
                        <View style={[this.state.decoration == 'Patron' ? { height: actualDimensions.height - 102, width: actualDimensions.width - 2 } : { display: 'none' }]}></View>
                        <View style={[this.state.decoration == 'Patron' ? { flex: 0, height: 100, width: actualDimensions.width - 2, backgroundColor: 'black' } : { display: 'none' }]}>
                            <TextInput
                                style={[this.state.decoration == 'Patron' ? { flex: 1, fontSize: 20, color: 'white', textAlign: 'center', textAlignVertical: 'center' } : { display: 'none' }]}
                                onChangeText={(text) => this.textInput = text}
                                onEndEditing={() => this.forceUpdate()}
                                multiline={true}>
                                <Text style={[this.state.decoration == 'Patron' ? { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 20, color: 'white' } : { display: 'none' }]}><Text>{this.textInput}</Text></Text>
                            </TextInput>
                        </View>
                        <View style={[this.state.decoration == 'Ribbon' ? { height: ((actualDimensions.height - 2) / 2) - 13, width: actualDimensions.width - 2 } : { display: 'none' }]}></View>
                        <View style={[this.state.decoration == 'Ribbon' ? { flex: 0, height: 26, width: actualDimensions.width - 2, backgroundColor: 'rgba(0,0,0,0.5)' } : { display: 'none' }]}>
                            <TextInput
                                style={[this.state.decoration == 'Ribbon' ? { flex: 1, fontSize: 12, color: 'white', padding: 4, textAlignVertical: 'center', textAlign: 'center' } : { display: 'none' }]}
                                onChangeText={(text) => this.textInput = text}
                                onEndEditing={() => this.forceUpdate()}
                                multiline={true}>
                                <Text style={[this.state.decoration == 'Ribbon' ? {} : { display: 'none' }]}><Text>{this.textInput}</Text></Text>
                            </TextInput>
                        </View>
                    </NoFlickerImageBackground>
                </ TouchableWithoutFeedback >
            )
        }
    }
}

export class GoodOlCamera extends Component {
    constructor(props) {
        super(props);
        this.isBursting = false;
        this.camera;
        this.loopViewShot;
        this.viewShot;
        this.burst = []; // the tmpArray
        this.tmpBurst = [];
        this.pictureArray = []; // just the data URIs
        this.supg6 = null;
        this.supg7 = null;
        this.textInput;
        this.picture = null; // just the data URI
        this.tmpPicture = null;
        console.log("Camera constructed");
        this.executionArray = [];
    }
    state = {
        torch: 'off',
        type: RNCamera.Constants.Type.back,
        decoration: 'Vanilla'
    };
    decoration() {
        console.log("Chaging decoration from camera");
        switch (this.state.decoration) {
            case 'Vanilla':
                this.setState({ decoration: 'Cinema' });
                break;
            case 'Cinema':
                this.setState({ decoration: 'Patron' });
                break;
            case 'Patron':
                this.setState({ decoration: 'Ribbon' });
                break;
            case 'Ribbon':
                this.setState({ decoration: 'Vanilla' });
                break;
        }
    }
    burstPicture = async () => {
        this.executionArray.push(true);
        var timer = new Timer;
        if (this.isBursting) {
            timer.Start();
            const data = await this.camera.takePictureAsync({ quality: 0.1, doNotSave: true, base64: true });
            console.log("Picture has taken:", timer.TimeMS(), "MS");
            var timeToDelay = 200 - timer.TimeMS();
            timeToDelay > 0 ? await sleep(timeToDelay) : {}
            data ? this.tmpBurst.push('data:image/jpeg;base64,' + data.base64) : {}
            if (this.isBursting) {
                this.executionArray.pop();
                this.burstPicture();
            } else {
                this.executionArray.pop();
                this.executionArray.length == 0 ? this.processBurst(this.tmpBurst) : {}
            }
        }
    }
    async processBurst(theBurst) {
        for (var i = 0; i < theBurst.length; i++) {
            var resizedImage = await ImageResizer.createResizedImage(theBurst[i], imageSize.width, imageSize.height, 'JPEG', 75);
            console.log(resizedImage);
            var base64resizedImage = await RNFS.readFile(resizedImage.path, 'base64');
            this.burst.push('data:image/jpeg;base64,' + base64resizedImage);
        }
        this.forceUpdate();
    }
    takePicture = async () => {
        var timer = new Timer;
        timer.Start();
        const data = await this.camera.takePictureAsync({ quality: 0.1, doNotSave: true, base64: true });
        console.log("Picture time:", timer.TimeMS(), "MS");
        console.log("Picture data:", data);
        this.tmpPicture = 'data:image/jpeg;base64,' + data.base64;
        this.forceUpdate();
    }
    render() {
        if (this.tmpPicture) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9edf3' }}>
                    <View style={{ margin: 16, borderWidth: 1 }}>
                        <SupG7 image={this.tmpPicture} ref={(supg7) => this.supg7 = supg7} cb={(picUri) => this.picture = picUri} />
                    </View>
                    <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('window').width - 32, height: 48, backgroundColor: '#f7deef' }}>
                        <TouchableOpacity
                            onPress={async () => {
                                this.supg7.shoot()
                                    .then(() => {
                                        this.props.callBack({ picture: this.picture });
                                    })
                            }}>
                            <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32), justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>OK</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('window').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => {
                            this.supg7.decoration();
                            this.decoration();
                        }}>
                            <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32) / 2, justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>{this.state.decoration}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this.tmpPicture = null;
                            this.setState({ decoration: 'Vanilla' })
                        }}>
                            <View style={{ borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32) / 2, justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>Try Again</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View >
            )
        } else if (this.burst.length > 0) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9edf3' }}>
                    <View style={{ flex: 1, margin: 16, borderWidth: 1 }}>
                        <SupG9 images={this.burst} ref={ref => this.supg6 = ref} cb={(pictureLoop) => this.props.callBack(pictureLoop)} />
                    </View>
                    <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('window').width - 32, height: 48, backgroundColor: '#f7deef' }}>
                        <TouchableOpacity
                            onPress={() => {
                                this.supg6.shoot();
                            }}>
                            <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32), justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>OK</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('window').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => {
                            this.supg6.decoration();
                            this.decoration();
                        }}>
                            <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32) / 2, justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>{this.state.decoration}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this.burst.length = 0;
                            this.tmpBurst.length = 0;
                            this.setState({ decoration: 'Vanilla' });
                        }}>
                            <View style={{ borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32) / 2, justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>Try Again</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View >
            )
        } else {
            return (
                <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9edf3' }}>
                    <View style={{ width: actualDimensions.width - 2, height: actualDimensions.height - 2, margin: 16, alignSelf: 'center', justifyContent: 'center' }}>
                        <FillToAspectRatio>
                            <RNCamera
                                style={{ flex: 1 }}
                                ref={(ref) => this.camera = ref}
                                camera1ScanMode='boost'
                                captureAudio={false}
                                flashMode={this.state.torch}
                                type={this.state.type}
                            />
                        </FillToAspectRatio>
                    </View>
                    <View style={{ flex: 1 }}></View>
                    <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('window').width - 32, height: 48, backgroundColor: '#f7deef' }}>
                        <TouchableOpacity
                            onPress={() => { this.takePicture(); }}
                            onLongPress={() => { this.isBursting = true; this.burstPicture(); }}
                            onPressOut={() => {
                                if (this.isBursting) {
                                    this.isBursting = false;
                                    console.log("Burst length:", this.tmpBurst.length);
                                }
                            }}>
                            <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32), justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>Picture</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('window').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => {
                            if (this.state.torch == 'torch') {
                                this.setState({ torch: 'off' });
                            } else {
                                this.setState({ torch: 'torch' });
                            }
                        }}>
                            <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32) / 2, justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>Flash</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            if (this.state.type == RNCamera.Constants.Type.back) {
                                this.setState({ type: RNCamera.Constants.Type.front });
                            } else {
                                this.setState({ type: RNCamera.Constants.Type.back });
                            }
                        }}>
                            <View style={{ borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('window').width - 32) / 2, justifyContent: 'center' }}>
                                <Text style={styles.buttonText}>Flip</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        }
    }
}

const styles = StyleSheet.create({
    qrContainer: {
        alignItems: 'center',
        padding: 20
    },
    container: {
        flex: 1,
        //marginTop: StatusBar.currentHeight || 0,
        //marginBottom: 20,
        backgroundColor: '#f9edf3',
    },
    container2: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f9edf3',
    },
    title: {
        fontSize: 32,
    },
    coolText: {
        fontSize: 18,
        fontFamily: 'sans-serif-medium',
        paddingLeft: 15,
        paddingTop: 15
    },
    buttonText: {
        fontSize: 15,
        fontFamily: 'sans-serif-medium',
        textAlign: 'center'
    },
    eventItem: {
        backgroundColor: '#b174a2',
        //backgroundColor: '#805ACC',
        padding: 25,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    eventImage: {
        width: 80,
        height: 80
    },
    eventItemContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#b174a2',
        marginVertical: 8,
        marginHorizontal: 16,
    },
    selectedEventItem: {
        backgroundColor: '#b174a2',
        padding: 25,
        marginVertical: 8,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: 'black'
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16
    },
    friendImage: {
        width: 60,
        height: 60
    },
    friendContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f9c2ff',
        marginVertical: 8,
        marginHorizontal: 16
    },
    selectedFriendContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f9c2ff',
        marginVertical: 8,
        marginHorizontal: 16,
        borderColor: 'black',
        borderWidth: 1
    },
    invitationItem: {
        backgroundColor: '#A483FF',
        padding: 22,
        marginVertical: 8,
        marginHorizontal: 16
    },
    selectedItem: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderColor: 'black',
        borderWidth: 1
    },
    addFriendItem: {
        backgroundColor: 'white',
        padding: 15,
        marginVertical: 0,
        marginHorizontal: 0,
    },
    buttons: {
        backgroundColor: '#f7deef',
        height: 55,
        justifyContent: 'center',
        marginVertical: 8,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: 'black'
    },
    bottomButton: {
        backgroundColor: '#f7deef',
        height: 55,
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 24,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: 'black',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
    },
    buttons1: {
        backgroundColor: '#f7deef',
        padding: 15,
        marginLeft: 8,
        marginTop: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'black',
        width: 120
    },
    buttons2: {
        backgroundColor: '#f7deef',
        padding: 15,
        marginTop: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'black',
        width: 120
    },
    buttons3: {
        backgroundColor: '#f7deef',
        padding: 15,
        marginTop: 8,
        marginBottom: 16,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'black',
        width: 120
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    }
});