import React, { Component, useState, setState, useEffect, useRef } from 'react';
import {
  SafeAreaView, ScrollView, StatusBar, FlatList, StyleSheet, Text, useColorScheme, View, ImageBackground,
  TouchableOpacity, TextInput, Button, TouchableWithoutFeedback, BackHandler, LogBox, Image, Dimensions
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { SetString, GetString, Clear } from './LocalStorage';
import { HashMessage, GenerateNonceB64 } from './Crypto';

import ImagePicker from 'react-native-image-crop-picker';

import { HoursToMs, Timer } from './Time';

import messaging from '@react-native-firebase/messaging';
import db from '@react-native-firebase/database';

import { SupG5, FastCameraView, GoodOlCamera, SupG4, imageSize } from './Camera';


const cameraPictureSize = {
  width: Dimensions.get('window').width / 1.5,
  height: Dimensions.get('window').height / 2
}

// STATES --------------------------------
let _loading_ = 0; // It goes on _loading_ when it's undefined I thing, this could be taken advantage of.
let _addFriend_ = 1;
let _friend_ = 2;
let _createEvent_ = 3;
let _scanning_ = 4;
let _createQr_ = 5;
let _makeYourProfile_ = 6;
let _details_ = 7;
let _eventChat_ = 8;
let _camera_ = 9;
let _hyper_ = 10;
let _hyperChat_ = 11;

// SECONDARYSTATE
let _crowns_ = 10;
let _invitations_ = 11;
let _participants_ = 12;

// MESSAGE TYPES -------------------------
let direct_message_ = '1';
let event_invitation_ = '2';
let hyper_chat_ = '3';


// USER DATA -----------------------------
var USERID;
var NAME;
var IMAGE;
var FRIENDS;
var EVENTS;
var INVITATIONS;
var SAVEDMESSAGES;
var SELECTEDITEMS;
var QRCODE;
var WATCHINGEVENT;
var CURRENTCHAT;
var LIVECHATLISTENER;
var HYPERCHATS = [];
// TMP DATA ------------------------------
var TMPLIST = [];
// OPTIONS -------------------------------
const options = {
  includeBase64: true,
  width: 150,
  height: 150,
  compressImageQuality: 0.1,
  mediaType: 'photo',
  cropping: true
};
const options2 = {
  includeBase64: true,
  width: 200,
  height: 200,
  compressImageQuality: 0.1,
  mediaType: 'photo',
  cropping: true
};
const placeHolder = require('./assets/picture_place_holder.png');

// APP VAR??? ----------------------------
var svg;


// TEST FUNCTIONS ------------------------
function TestInv() {
  PushMessage(
    "-Mf_GwJng_gl3l1FSi9B",
    { title: "Andrew" + " is down 4 " + "swimming" + '.' },
    { type: event_invitation_, eventID: "-Mfd6Vacj8o3vcrHANuh" }
  );
}

// UTILITY FUNCTIONS ---------------------
function UserIDsOfList(userList) {
  var tmpList = [];
  userList.forEach(user => tmpList.push(user.userID));
  return tmpList;
}

function UnselectSelectedFriends() {
  FRIENDS.forEach(friend => {
    if (SELECTEDITEMS[friend.userID]) {
      SELECTEDITEMS[friend.userID] = !SELECTEDITEMS[friend.userID];
    }
  });
}

// SAVES, GETS, DELETE -------------------
function SaveEverything() {
  SetString("userID", USERID);
  SetString("name", NAME);
  SetString("friendList", JSON.stringify(FRIENDS));
  SetString("eventList", JSON.stringify(EVENTS));
  SetString("invitations", JSON.stringify(INVITATIONS));
  SetString("image", IMAGE);
  SaveSelectedItems();
}

function SaveFriendList() {
  SetString("friendList", JSON.stringify(FRIENDS));
}

function SaveSelectedItems() {
  SetString("selectedItems", JSON.stringify(SELECTEDITEMS));
}

function SaveEventList() {
  SetString("eventList", JSON.stringify(EVENTS));
}

function SaveHyperchats() {
  SetString("hyperchats", JSON.stringify(HYPERCHATS));
}

function SaveImage() {
  SetString("image", IMAGE);
}

function GetSelectedItems() {
  return GetString('selectedItems');
}

function GetInvitationsList() {
  return GetString("invitations");
}

function GetUserID() {
  return GetString("userID");
}

function GetFriendList() {
  return GetString("friendList");
}

function GetEventList() {
  return GetString("eventList");
}

function GetName() {
  return GetString("name");
}

function DeleteAll() {
  Clear();
  FRIENDS = [];
  EVENTS = [];
  NAME = '';
  TEXTINPUT = '';
  TEXTINPUT2 = '';
  TMPLIST = [];
  INVITATIONS = [];
  USERID = '';
  SELECTEDITEMS = {};
  IMAGE = '';
}

function GetImage() {
  return GetString("image");
}

function GetQrCode() {
  return GetString("qrcode");
}

function SaveQrCode() {
  SetString("qrcode", QRCODE);
}

// FUNCTIONS ----------------------------
async function PushMessage(to, notification, data = null) {
  const pushMessage = db().ref('MessageRequests').push();
  const message = { notification: notification, data: data, to: to };
  pushMessage.set(message).then(() => { console.log("Pushed message:"); console.log(message) });
}

async function InitialiseUser(name, image) {
  NAME = name; IMAGE = image;
  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();
  const pushUser = db().ref('Users').push();
  const userID = pushUser.key; USERID = userID
  pushUser.set({ current_token: token }).then(() => {
    console.log("User successfully created, saving data locally.");
    SetString("userID", userID);
    SetString("name", name);
    SetString("friendList", '[]');
    SetString("eventList", '[]');
    SetString("invitations", '[]');
    SetString("selectedItems", '{}');
    SetString("image", image);
    LoadLocalData();
  })
}

async function LoadLocalData() {
  FRIENDS = JSON.parse(await GetFriendList());
  EVENTS = JSON.parse(await GetEventList());
  NAME = await GetName();
  INVITATIONS = JSON.parse(await GetInvitationsList());
  USERID = await GetUserID();
  SELECTEDITEMS = JSON.parse(await GetSelectedItems());
  IMAGE = await GetImage();
  QRCODE = await GetQrCode();
  console.log("Local data loaded:");
  console.log("------------------------------------")
  console.log("UserID", USERID);
  console.log("Name: ", NAME);
  console.log("FriendList:", FRIENDS);
  console.log("EventList:", EVENTS);
  console.log("Invitations:", INVITATIONS);
  console.log("SelectedItems:", SELECTEDITEMS);
  console.log("Image:", IMAGE);
  console.log("QrCode:", "QRCode is a longAssString");
  console.log("------------------------------------")
}

async function InitialiseListeners() {
  if (EVENTS.length > 0) {
    EVENTS.forEach(event => {
      LISTENERS[event.eventID] = db().ref('/Events/' + event.eventID).on()
    })
  }
}

function AddFriend(name, userID, image) {
  FRIENDS.push({ userID: userID, name: name, image: image });
  SELECTEDITEMS[userID] = false;
  SaveFriendList();
  SaveSelectedItems();
}

async function CreateEvent(eventName, friends, duration = 24, eventImage) {
  // Creating the time stamp
  var startTime = new Date();
  var startTimeMS = startTime.getTime();
  var endTime = new Date(startTimeMS + HoursToMs(duration));
  var endTimeMS = endTime.getTime();
  // Creating the push and getting the key
  const pushEvent = db().ref('/Events/').push();
  const eventID = pushEvent.key;
  // The event data
  var event = {
    eventID: eventID,
    eventName: eventName,
    host: { userID: USERID, name: NAME, image: JSON.stringify(IMAGE) },
    crowns: [],
    participants: [],
    invited: friends,
    image: eventImage,
    messages: [],
    startTimeMS: startTimeMS,
    endTimeMS: endTimeMS,
  };
  // Pushing the event
  pushEvent.set(event).then(() => {
    console.log(eventName, "was succesfully pushed");
    console.log("Event data:");
    console.log(event);
  });
  // Pushing notifications to the invited
  PushMessage(
    UserIDsOfList(friends),
    { title: NAME + " is down 4 " + eventName + '.' },
    { type: event_invitation_, eventID: eventID, host: NAME, eventImage: eventImage, eventName: eventName }
  ).then(response => {
    console.log("Notification for " + eventName + " were sent.");
    console.log("Response:");
    console.log(response);
  }).catch(error => {
    console.log("Failed to send notifications for " + eventName + ':');
    console.log(error);
  })
  // Pushing the event locally
  EVENTS.push(event);
  SELECTEDITEMS[eventID] = false;
  UnselectSelectedFriends();
  SaveEventList();
  SaveSelectedItems();
}

async function CreateHyperchat(friends, initialMessage) {
  // The time
  var startTime = (new Date()).getTime();
  var endTime = (new Date(startTime + HoursToMs(6))).getTime();
  // Creating the push and getting the key
  const pushHyperchat = db().ref('/Hyperchats/').push();
  const hyperchatID = pushHyperchat.key;
  // The hyperchat data
  var hyperchat = {
    hyperchatID: hyperchatID,
    hyperchatters: friends,
    messages: [initialMessage],
    startTime: startTime,
    endTime: endTime
  };
  // Push the hyperchat
  pushHyperchat.set(hyperchat).then(() => {
    console.log("Hyperchat succesfully intialized!", "Data:", hyperchat);
  }).catch(reason => {
    console.log("Hyperchat failed to be initialized!", "Reason:", reason);
  });
  // Push notifications
  PushMessage(
    UserIDsOfList(friends),
    { title: "New Hyperchat by: " + NAME },
    { type: hyper_chat_, hyperchatID: hyperchatID }
  ).then(success => {
    console.log("Notification for hyperchat sent!", "success:", success);
  }).catch(reason => {
    console.log("Notification for hyperchat failed!", "reason:", reason);
  })
  // Push the chat locally
  HYPERCHATS.push(hyperchat);
  SELECTEDITEMS[hyperchatID] = false;
  UnselectSelectedFriends();
  SaveHyperchats();
  SaveSelectedItems();
}

async function ParticipateInEvent(invitation) {
  var currentParticipants = [];
  const myData = { name: NAME, image: null, userID: USERID };
  const participantsRef = db().ref('/Events/' + invitation.eventID + '/participants/');
  participantsRef.transaction(currentData => {
    if (currentData == null) {
      return [myData];
    } else {
      currentParticipants = currentData;
      currentData.push(myData);
      return currentData;
    }
  }).then((value) => {
    console.log("Participation transaction done:");
    console.log(value);
    // Now we remove the invitation from INVITATIONS
    var tmpList = [];
    INVITATIONS.forEach((invitation) => {
      if (invitation.eventID != eventID) {
        tmpList.push(invitation);
      }
    })
    INVITATIONS = tmpList;
    // Send notification 
    currentParticipants.push(invitation.host);
    PushMessage(UserIDsOfList(currentParticipants), { title: "New participant in " + invitation.eventName + ':', body: NAME });
  })
    .catch((error) => {
      console.log("There was a problem trying to participate in event:", invitation.eventName);
      console.log("Error:"); console.log(error);
    });
}

function CurrentlySelected() {
  var tmpArray = [];
  FRIENDS.forEach((friend) => {
    if (SELECTEDITEMS[friend.userID]) {
      tmpArray.push({ userID: friend.userID, name: friend.name, image: JSON.stringify(friend.image) });
    }
  })
  TMPLIST = tmpArray;
}

async function CrownParticipants(userList, event) {
  const crownsRef = db().ref('/Events/' + event.eventID + '/crowns/');
  crownsRef.transaction(currentCrowns => {
    if (currentCrowns == null) {
      return userList;
    } else {
      const newCrowns = currentCrowns.concat(userList);
      return newCrowns;
    }
  }).then((transactionResult) => {
    console.log("Crowning transaction done:");
    console.log(transactionResult);
    // Send notification to the new crowns
    PushMessage(UserIDsOfList(userList), { title: "You're a new crown in " + event.eventName + '.' });
  }).catch((error) => {
    console.log("There was an error crowning the users:", userList);
    console.log("Error:", error);
  });
}

async function PutMessageInEvent(message, event) {
  const messagesRef = db().ref('/Events/' + event.eventID + '/messages/');
  const participantsGet = await db().ref('/Events/' + event.eventID + '/participants/').once('value');
  //const participantsIDs = UserIDsOfList(participantsGet.val());
  messagesRef.transaction(currentMessages => {
    if (currentMessages == null) {
      var newMessages = [message];
      return newMessages;
    } else {
      var newMessages = currentMessages;
      newMessages.push(message);
      return newMessages;
    }
  }).then((transactionResult) => {
    console.log("The message was succesfully put:");
    console.log(transactionResult);
    // Send notification to participants
    //PushMessage(participantsIDs, { title: NAME + ' in ' + event.eventName + ':', body: message.text });
  }).catch((error) => {
    console.log("There was an error putting a message in the event:");
    console.log(error);
    console.log("Message:", message);
    console.log("Event:", event.eventName);
  });
}

async function AppendUsersToEvent(userList, event) {
  var invitationsRef = db().ref('/Events/' + event.eventID + '/invitations/');
  invitationsRef.transaction((currentInvitations) => {
    var newInvitations = currentInvitations.concat(userList);
    return newInvitations;
  }).then((transactionResult) => {
    console.log("Sucessfully appended the new users to", event.eventName + ':');
    console.log(transactionResult);
  }).catch((error) => {
    console.log("Error appending the new users to", event.eventName + ':');
    console.log(error);
  });
  // Pushing a notification de the users
  PushMessage(
    UserIDsOfList(userList),
    { title: NAME + " invited you to " + event.eventName },
    { type: event_invitation_, eventID: event.eventID, host: event.host, image: JSON.stringify(event.eventImage), eventName: event.eventName }
  );
}

function RemoveSelection() {
  var friends = [];
  var events = [];
  var invitations = [];
  FRIENDS.forEach(friend => {
    if (!SELECTEDITEMS[friend.userID]) {
      friends.push(friend);
    }
  });
  EVENTS.forEach(event => {
    if (!SELECTEDITEMS[event.eventID]) {
      events.push(event);
    }
  });
  INVITATIONS.forEach(inv => {
    if (!SELECTEDITEMS[inv.eventID]) {
      invitations.push(inv);
    }
  });
  INVITATIONS = invitations;
  EVENTS = events;
  FRIENDS = friends;
}

function RemoveLiveChatListener() {
  LIVECHATLISTENER = null;
}

// Nice component
Nice = (props) => {
  console.log(props);
  if (props.item.photo) {
    return (
      <Image source={{ uri: props.item.photo }} style={{ height: imageSize.height, width: imageSize.width }} resizeMode={'stretch'} />
    )
  } else if (props.item.photoLoop) {
    return (
      <SupG4 images={props.item.photoLoop} />
    )
  } else {
    return (
      <View style={{ display: 'none' }} />
    )
  }
}


// APPLICATION ---------------------------
export default class App extends Component {
  constructor(props) {
    super(props);
    this.cameraData = { picture: null, photoLoop: null };
  }
  state = {
    mainState: _loading_,
    subState: _invitations_,
    previousState: _friend_
  };
  mainState(state) {
    var currentState = this.state.mainState;
    this.setState({ mainState: state, previousState: currentState });
  }
  backAction = () => {
    console.log("Back action, changing from:", this.state.mainState);
    switch (this.state.mainState) {
      case _addFriend_:
        this.mainState(_friend_)
        return true;
      case _createEvent_:
        this.mainState(_friend_)
        return true;
      case _friend_:
        this.mainState(_friend_);
        return true;
      case _scanning_:
        this.mainState(_addFriend_);
        return true;
      case _details_:
        this.mainState(_friend_);
        return true;
      case _eventChat_:
        clearInterval(this.stupidInterval);
        RemoveLiveChatListener();
        this.mainState(_friend_);
        return true;
      case _camera_:
        this.mainState(_eventChat_);
        return true;
      case _hyper_:
        this.mainState(_friend_);
        return true;
    }
  }
  async componentDidMount() {
    //DeleteAll();
    await LoadLocalData();
    if (USERID == null) {
      this.mainState(_makeYourProfile_);
      console.log("User is not initialized.");
    } else {
      this.mainState(_friend_);
      console.log("Successfully loaded user.");
    }
    BackHandler.addEventListener("hardwareBackPress", this.backAction);
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

    if (messaging().isDeviceRegisteredForRemoteMessages) {
      console.log("Device is registered for messaging. Token: ");
      console.log(await messaging().getToken());
    } else {
      console.log("Device isn't registered for messaging.")
    }
    this.messageListener = messaging().onMessage(async message => {
      console.log("Received a message:");
      console.log(message);
      switch (message.data.type) {
        case direct_message_:
          break;
        case event_invitation_:
          var eventRef = await db().ref('/Events/' + message.data.eventID).once('value');
          var theEvent = eventRef.val();
          let invObj = {
            hostName: theEvent.host.name,
            eventImage: theEvent.image,
            eventName: theEvent.eventName,
            invited: theEvent.invited,
            participants: theEvent.participants,
            crowns: theEvent.crowns
          };
          INVITATIONS.push(invObj);
          if (this.state.mainState == _friend_) {
            this.mainState(_friend_);
          }
          break;
      }
    });
  }
  componentWillUnmount() {
    console.log("Cleaning up");
    SaveEverything();
    BackHandler.removeEventListener("hardwareBackPress", this.backAction);
    this.messageListener();
  }
  //Fun
  handleCameraData(data) {
    this.cameraData = data;
    console.log("Camera data:", this.cameraData);
  }
  // QR FUNC
  qrCallback = (data) => {
    QRCODE = 'data:image/svg+xml;base64,' + data;
    SaveQrCode();
  }
  getDataURL = () => {
    svg.toDataURL(this.qrCallback);
  }
  // ITEMS --- Views are usually made of items
  messageItem = (item) => {
    return (
      <View style={[{ flex: 1, marginTop: 16, width: imageSize.width },
      item.messageID == CURRENTCHAT[CURRENTCHAT.length - 1].messageID ? { marginBottom: 16 } : {},
      item.sender.userID == USERID ? { flexDirection: 'row', alignSelf: 'flex-end', marginRight: 16 } : { marginLeft: 16 }]}>
        <View style={{ flex: 1, flexDirection: 'column', width: imageSize.width }}>
          <View style={{ flexDirection: 'row', height: 25, backgroundColor: '#f9c2ff' }}>
            <Image source={{ uri: item.sender.image }} style={{ height: 25, width: 25 }} />
            <Text style={{ paddingLeft: 6, fontFamily: 'sans-serif-medium' }}>{item.sender.name}</Text>
          </View>
          <View style={[item.text ? { backgroundColor: '#f7deef' } : { display: 'none' }]}>
            <Text>
              <Text style={{ padding: 3, fontFamily: 'sans-serif-medium', fontSize: 14 }}>{item.text}</Text>
            </Text>
          </View>
          <Nice item={item} />
        </View>
      </View>
    )
  }
  tmpFriendItem = (item) => {
    return (
      <View style={[
        item.userID == TMPLIST[0].userID ?
          { marginTop: 16, marginBottom: 8 } : item.userID == TMPLIST[TMPLIST.length - 1].userID ?
            { marginTop: 8, marginBottom: 16 } : { marginVertical: 8 },
        { marginHorizontal: 16, backgroundColor: '#f9c2ff', flex: 1, flexDirection: 'row', borderColor: '#f9edf3', borderWidth: 1 }]}>
        <Image style={{ width: 60, height: 60 }} source={require('./assets/hashirama.jpg')} />
        <View style={{ borderLeftWidth: 1, borderLeftColor: '#f9c2ff' }}>
          <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.name}</Text>
        </View>
      </View>
    )
  }
  EventItem = (item) => {
    return (
      <TouchableWithoutFeedback
        onPress={() => { SELECTEDITEMS[item.eventID] = !SELECTEDITEMS[item.eventID]; this.forceUpdate(); }}>
        <View style={[
          item.eventID == EVENTS[0].eventID && INVITATIONS.length == 0 ?
            { borderWidth: 1, borderColor: '#f9edf3', marginHorizontal: 16, marginBottom: 8, marginTop: 16, backgroundColor: '#b174a2', flexDirection: 'row' } :
            { borderWidth: 1, borderColor: '#f9edf3', marginHorizontal: 16, marginVertical: 8, backgroundColor: '#b174a2', flexDirection: 'row' }
        ]}>
          <Image style={{ width: 80, height: 80 }} source={{ uri: item.image }} />
          <View style={{ borderLeftWidth: 1, borderLeftColor: '#b174a2' }}>
            <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.eventName}</Text>
            <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12 }}>Host: {item.host.name}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback >
    )
  }
  SelectedEventItem = (item) => {
    return (
      <View style={[
        item.eventID == EVENTS[0].eventID && INVITATIONS.length == 0 ?
          { borderWidth: 1, borderColor: 'black', marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: '#b174a2' } :
          { borderWidth: 1, borderColor: 'black', marginHorizontal: 16, marginVertical: 8, backgroundColor: '#b174a2' }
      ]}>
        <TouchableWithoutFeedback
          onPress={() => { SELECTEDITEMS[item.eventID] = !SELECTEDITEMS[item.eventID]; this.forceUpdate(); }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Image style={{ width: 80, height: 80 }} source={{ uri: item.image }} />
            <View style={{ flex: 1, flexDirection: 'column', borderLeftWidth: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.eventName}</Text>
              <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12 }}>Host: {item.host.name}</Text>
            </View>
          </View >
        </TouchableWithoutFeedback>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, padding: 12 }}>
            <TouchableOpacity onPress={async () => {
              var eventRef = db().ref('/Events/' + item.eventID);
              var eventRead = await eventRef.once('value');
              WATCHINGEVENT = eventRead.val();
              var eventChatRef = eventRef.child('/messages');
              var chatRead = await eventChatRef.once('value');
              CURRENTCHAT = chatRead.val();
              LIVECHATLISTENER = eventChatRef.on(('value'), snapshot => {
                console.log("New message in currentChat!");
                CURRENTCHAT = snapshot.val();
                if (this.state.mainState == _eventChat_)
                  this.forceUpdate();
              });
              this.mainState(_eventChat_);
            }}>
              <Text style={styles.buttonText}>Chat</Text>
            </TouchableOpacity>
          </View>
          <View style={{ borderTopWidth: 1, flex: 1, padding: 12 }}>
            <TouchableOpacity onPress={async () => {
              var eventRef = await db().ref('/Events/' + item.eventID).once('value');
              var currentEventData = eventRef.val();
              WATCHINGEVENT = currentEventData;
              this.mainState(_details_);
            }}>
              <Text style={styles.buttonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View >
    )
  }
  friendItem = (item) => {
    return (
      <TouchableWithoutFeedback
        onPress={() => { SELECTEDITEMS[item.userID] = !SELECTEDITEMS[item.userID]; this.forceUpdate(); }}>
        <View style={[
          item.userID == FRIENDS[FRIENDS.length - 1].userID ?
            { marginTop: 8, marginBottom: 16, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row', borderColor: '#f9edf3', borderWidth: 1 } :
            item.userID == FRIENDS[0].userID && HYPERCHATS.length == 0 && EVENTS.length == 0 && INVITATIONS.length == 0 ?
              { marginTop: 16, marginBottom: 8, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row', borderColor: '#f9edf3', borderWidth: 1 } :
              { marginVertical: 8, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row', borderColor: '#f9edf3', borderWidth: 1 }
        ]}>
          <Image style={{ width: 60, height: 60 }} source={require('./assets/hashirama.jpg')} />
          <View style={{ borderLeftWidth: 1, borderLeftColor: '#f9c2ff' }}>
            <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.name}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
  selectedFriendItem = (item) => {
    return (
      <TouchableWithoutFeedback
        onPress={() => { SELECTEDITEMS[item.userID] = !SELECTEDITEMS[item.userID]; this.forceUpdate(); }}>
        <View style={[
          item.userID == FRIENDS[FRIENDS.length - 1].userID ?
            { marginTop: 8, marginBottom: 16, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row', borderColor: 'black', borderWidth: 1 } :
            item.userID == FRIENDS[0].userID && HYPERCHATS.length == 0 && EVENTS.length == 0 && INVITATIONS.length == 0 ?
              { marginTop: 16, marginBottom: 8, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row', borderColor: 'black', borderWidth: 1 } :
              { marginVertical: 8, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row', borderColor: 'black', borderWidth: 1 }
        ]}>
          <Image style={{ width: 60, height: 60 }} source={require('./assets/hashirama.jpg')} />
          <View style={{ borderLeftWidth: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.name}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
  invitationItem = (item) => {
    return (
      <TouchableWithoutFeedback
        onPress={() => { SELECTEDITEMS[item.eventID] = !SELECTEDITEMS[item.eventID]; this.forceUpdate(); }}>
        <View style={[
          item.eventID == INVITATIONS[0].eventID ?
            { marginTop: 16, marginBottom: 8, marginHorizontal: 16, backgroundColor: '#A483FF', flex: 1, flexDirection: 'row', borderColor: '#f9edf3', borderWidth: 1 } :
            { marginVertical: 8, marginHorizontal: 16, backgroundColor: '#A483FF', flex: 1, flexDirection: 'row', borderColor: '#f9edf3', borderWidth: 1 }
        ]}>
          <Image style={{ width: 80, height: 80 }} source={{ uri: item.eventImage }} />
          <View style={{ borderLeftWidth: 1, borderLeftColor: '#A483FF' }}>
            <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.eventName}</Text>
            <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12 }}>From: {item.hostName}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
  selectedInvitationItem = (item) => {
    return (
      <View style={[
        item.eventID == INVITATIONS[0].eventID ?
          { borderWidth: 1, borderColor: 'black', marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: '#A483FF' } :
          { borderWidth: 1, borderColor: 'black', marginHorizontal: 16, marginVertical: 8, backgroundColor: '#A483FF' }
      ]}>
        <TouchableWithoutFeedback
          onPress={() => { SELECTEDITEMS[item.eventID] = !SELECTEDITEMS[item.eventID]; this.forceUpdate(); }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Image style={{ width: 80, height: 80 }} source={{ uri: item.eventImage }} />
            <View style={{ borderLeftWidth: 1, borderLeftColor: 'black' }}>
              <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12, paddingTop: 12 }}>{item.eventName}</Text>
              <Text style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 12 }}>From: {item.hostName}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, padding: 12 }}>
            <TouchableWithoutFeedback onPress={() => { ParticipateInEvent(item); }}>
              <Text style={styles.buttonText}>Join</Text>
            </TouchableWithoutFeedback>
          </View>
          <View style={{ borderTopWidth: 1, flex: 1, padding: 12 }}>
            <TouchableWithoutFeedback onPress={() => { null; }}>
              <Text style={styles.buttonText}>Details</Text>
            </TouchableWithoutFeedback>
          </View>
        </View>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, padding: 12 }}>
            <TouchableWithoutFeedback onPress={() => { PushMessage(item.host.userID, { title: NAME + " declined " + item.eventName + " invitation.", body: this.invitationTextInput }); }}>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableWithoutFeedback>
          </View>
          <View style={{ borderTopWidth: 1, flex: 1, paddingLeft: 12, paddingRight: 12 }}>
            <TextInput
              placeholder="Reason..(optional)"
              style={styles.buttonText}
              keyboardType="default"
              onChangeText={text => this.invitationTextInput = text}
            />
          </View>
        </View>
      </View>

    )
  }
  // VIEWS
  invitationsView = () => {
    switch (this.state.subState) {
      case _invitations_:
        return (
          <View style={styles.container}>
            <FlatList
              data={WATCHINGEVENT.invited}
              renderItem={({ item }) => { return this.down4FriendItem(item); }}
              keyExtractor={({ userID }) => userID}
            />
            <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef' }}>
              <TouchableOpacity onPress={() => null}>
                <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Add</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => null}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Crown</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => this.setState({ subState: _invitations_ })}>
                <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Invitations</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ subState: _participants_ })}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Participants</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ subState: _crowns_ })}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Crowns</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case _participants_:
        return (
          <View style={styles.container}>
            <FlatList
              data={WATCHINGEVENT.participants}
              renderItem={({ item }) => { return this.down4FriendItem(item); }}
              keyExtractor={({ userID }) => userID}
            />
            <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef' }}>
              <TouchableOpacity onPress={() => null}>
                <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Add</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => null}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Crown</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => this.setState({ subState: _invitations_ })}>
                <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Invitations</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ subState: _participants_ })}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Participants</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ subState: _crowns_ })}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Crowns</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case _crowns_:
        return (
          <View style={styles.container}>
            <FlatList
              data={WATCHINGEVENT.crowns}
              renderItem={({ item }) => { return this.down4FriendItem(item); }}
              keyExtractor={({ userID }) => userID}
            />
            <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef' }}>
              <TouchableOpacity onPress={() => null}>
                <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Add</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => null}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Crown</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => this.setState({ subState: _invitations_ })}>
                <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Invitations</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ subState: _participants_ })}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Participants</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ subState: _crowns_ })}>
                <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                  <Text style={styles.buttonText}>Crowns</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  }
  hyperView = () => {
    return (
      <View style={styles.container}>
        <FlatList
          data={TMPLIST}
          renderItem={({ item }) => { return this.tmpFriendItem(item); }}
          keyExtractor={({ userID }) => userID}
        />
        <View style={{ width: Dimensions.get('screen').width - 32, height: 40, borderTopWidth: 1, borderRightWidth: 1, borderLeftWidth: 1, alignSelf: 'center' }}>
          <TextInput
            placeholder=":)"
            style={{ fontSize: 15, fontFamily: 'sans-serif-medium', alignSelf: 'center' }}
            keyboardType="default"
            onChangeText={text => this.hyperchatText = text}
            ref={input => this.hyperchatTextInput = input}
          />
        </View>
        <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef' }}>
          <TouchableOpacity onPress={() => null}>
            <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Save</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            this.hyperchatTextInput.clear();
            hyperChatters = TMPLIST;
            var initalMessage = {
              text: this.hyperchatText,
              photo: this.cameraData.picture,
              photoLoop: this.cameraData.photoLoop,
              sender: { name: NAME, image: IMAGE, userID: USERID },
              messageID: await HashMessage(USERID + await GenerateNonceB64()),
              timeStamp: (new Date()).getTime()
            };
            CreateHyperchat(TMPLIST, initalMessage)
              .then(() => this.mainState(_hyperChat_))
              .catch(() => console.log("Failed to create hyperchat!"));
          }}>
            <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Send</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => null}>
            <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Forward</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            const resObj = await ImagePicker.openPicker(options2);
            console.log("Image:", resObj);
            this.attachementImage = 'data:' + resObj.mime + ';base64,' + resObj.data;
          }}>
            <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Gallery</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { this.mainState(_camera_); }}>
            <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
              <Text style={[!this.cameraData.picture && !this.cameraData.photoLoop ? styles.buttonText : { display: 'none' }]}>Camera</Text>
              <Text style={[this.cameraData.picture || this.cameraData.photoLoop ? styles.buttonText : { display: 'none' }]}>@Camera</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  hyperViewChat = () => {

  }
  eventChatView = () => {
    return (
      <View style={styles.container}>
        <FlatList
          data={CURRENTCHAT}
          renderItem={({ item }) => { return this.messageItem(item); }}
          keyExtractor={({ messageID }) => messageID}
        />
        <View>
          <View style={{ width: Dimensions.get('screen').width - 32, height: 40, borderTopWidth: 1, borderRightWidth: 1, borderLeftWidth: 1, alignSelf: 'center' }}>
            <TextInput
              placeholder=":)"
              style={{ fontSize: 15, fontFamily: 'sans-serif-medium', alignSelf: 'center' }}
              keyboardType="default"
              onChangeText={text => this.eventChatTextInput = text}
              ref={input => this.input = input}
            />
          </View>
          <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef' }}>
            <TouchableOpacity onPress={() => null}>
              <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                <Text style={styles.buttonText}>Save</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              this.input.clear();
              var message = {
                text: this.eventChatTextInput,
                photo: this.cameraData.picture,
                photoLoop: this.cameraData.photoLoop,
                sender: { name: NAME, image: IMAGE, userID: USERID },
                messageID: await HashMessage(USERID + await GenerateNonceB64())
              };
              PutMessageInEvent(message, WATCHINGEVENT)
                .then(() => {
                  this.eventChatTextInput = null;
                  console.log("Sent message:", message, "\nCleared chat input");
                  this.cameraData = { picture: null, photoLoop: null };
                });
            }}>
              <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
                <Text style={styles.buttonText}>Send</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => null}>
              <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                <Text style={styles.buttonText}>Forward</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              const resObj = await ImagePicker.openPicker(options2);
              console.log("Image:", resObj);
              this.attachementImage = 'data:' + resObj.mime + ';base64,' + resObj.data;
            }}>
              <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                <Text style={styles.buttonText}>Gallery</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { this.mainState(_camera_); }}>
              <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
                <Text style={[!this.cameraData.picture && !this.cameraData.photoLoop ? styles.buttonText : { height: 0 }]}>Camera</Text>
                <Text style={[this.cameraData.picture || this.cameraData.photoLoop ? styles.buttonText : { height: 0 }]}>@Camera</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
  qrView = () => {
    return (
      <View style={styles.container2}>
        <View style={styles.qrContainer}>
          <QRCode
            size={300}
            value={NAME + '#' + USERID + '#' + IMAGE}
            ecl={'L'}
            getRef={(qr) => (svg = qr)}
          />
        </View>
        <Text style={styles.buttonText}>A way to make friends is to share this.</Text>
        <Text style={styles.buttonText}>It can be found in "Add Friend".</Text>
        <TouchableWithoutFeedback
          onPress={() => { this.mainState(_friend_); this.getDataURL(); }} >
          <View style={styles.buttons}>
            <Text style={styles.buttonText}>Ok!</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }
  loadingView = () => {
    return (
      <View>
        <Text>
          Loading lol
        </Text>
      </View>
    )
  }
  down4 = () => {
    return (
      <ScrollView style={styles.container}>
        <View>
          <FlatList
            data={TMPLIST}
            renderItem={({ item }) => { return this.tmpFriendItem(item); }}
            keyExtractor={({ userID }) => userID}
          />
        </View>
        <View style={{ marginVertical: 8, marginHorizontal: 16, backgroundColor: '#b174a2', flexDirection: 'row' }}>
          <TouchableWithoutFeedback
            onPress={async () => {
              const resObj = await ImagePicker.openPicker(options2);
              this.down4Image = 'data:' + resObj.mime + ';base64,' + resObj.data;
              console.log("Down4Image:", this.down4Image);
              this.mainState(_createEvent_);
            }}>
            <Image source={this.down4Image ? { uri: this.down4Image } : placeHolder} style={{ width: 80, height: 80 }} />
          </TouchableWithoutFeedback>
          <TextInput
            placeholder="Down 4 what...?"
            style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 13, paddingTop: 12 }}
            keyboardType="default"
            onChangeText={text => this.down4Text = text}
          />
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity onPress={async () => {
            await CreateEvent(this.down4Text, TMPLIST, 1, this.down4Image);
            this.down4Image = null;
            this.down4Text = null;
            this.mainState(_friend_);
          }}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }
  friendView = () => {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View>
            <FlatList
              data={INVITATIONS}
              renderItem={
                ({ item }) => {
                  if (SELECTEDITEMS[item.eventID]) {
                    return this.selectedInvitationItem(item);
                  } else {
                    return this.invitationItem(item);
                  }
                }
              }
              keyExtractor={({ eventID }) => eventID}
            />
          </View>
          <View>
            <FlatList
              data={EVENTS}
              renderItem={
                ({ item }) => {
                  if (SELECTEDITEMS[item.eventID]) {
                    return this.SelectedEventItem(item);
                  } else {
                    return this.EventItem(item);
                  }
                }
              }
              keyExtractor={({ eventID }) => eventID}
            />
          </View>
          <View>
            <FlatList
              data={FRIENDS}
              renderItem={
                ({ item }) => {
                  if (SELECTEDITEMS[item.userID]) {
                    return this.selectedFriendItem(item);
                  } else {
                    return this.friendItem(item);
                  }
                }
              }
              keyExtractor={({ userID }) => userID}
            />
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef' }}>
          <TouchableOpacity onPress={() => {
            CurrentlySelected();
            this.mainState(_hyper_);
          }}>
            <View style={{ borderLeftWidth: 1, borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Hyperchat</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            CurrentlySelected();
            this.mainState(_createEvent_);
          }}>
            <View style={{ borderTopWidth: 1, borderRightWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 2, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Down4</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignSelf: 'center', width: Dimensions.get('screen').width - 32, height: 48, backgroundColor: '#f7deef', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => { RemoveSelection(); this.forceUpdate(); }}>
            <View style={{ borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Remove*</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.mainState(_addFriend_)}>
            <View style={{ borderWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Add Friend</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => null}>
            <View style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, flex: 1, width: (Dimensions.get('screen').width - 32) / 3, justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Favorite</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

    );
  }
  addFriendView = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.qrContainer}>
          <Image source={{ uri: QRCODE }} style={{ width: 300, height: 300 }} />
        </View>
        <TouchableOpacity onPress={() => this.mainState(_scanning_)}>
          <View style={styles.buttons}>
            <Text style={styles.buttonText}>Scanner</Text>
          </View>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          keyboardType="default"
          onChangeText={text => this.addFriendTextInput = text}
          placeholder="Name"
        />
        <TextInput
          style={styles.input}
          keyboardType="default"
          onChangeText={text => this.addFriendTextInput2 = text}
          placeholder="Key"
        />
        <TouchableOpacity
          style={styles.buttons}
          onPress={() => {
            AddFriend(this.addFriendTextInput, this.addFriendTextInput2);
            this.mainState(_friend_);
          }}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </SafeAreaView >
    )
  }
  makeYourProfile = () => {
    return (
      <SafeAreaView style={styles.container2}>
        <View style={{ marginVertical: 8, marginHorizontal: 16, backgroundColor: '#f9c2ff', flexDirection: 'row' }}>
          <TouchableWithoutFeedback
            onPress={async () => {
              const resObj = await ImagePicker.openPicker(options);
              this.makeYourProfileImage = 'data:' + resObj.mime + ';base64,' + resObj.data;
              console.log(this.makeYourProfileImage);
              this.mainState(_makeYourProfile_);
            }}>
            <Image source={this.makeYourProfileImage ? { uri: this.makeYourProfileImage } : placeHolder} style={{ width: 60, height: 60 }} />
          </TouchableWithoutFeedback>
          <TextInput
            placeholder="Pick a name... and an image."
            style={{ fontSize: 15, fontFamily: 'sans-serif-medium', paddingLeft: 13, paddingTop: 12 }}
            keyboardType="default"
            onChangeText={text => this.makeYourProfileTextInput = text}
          />
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={async () => InitialiseUser(this.makeYourProfileTextInput, this.makeYourProfileImage).then(this.mainState(_createQr_))}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    )
  }
  scanningView = () => {
    return (
      <SafeAreaView style={styles.container}>
        <QRCodeScanner
          onRead={async (str) => {
            const data = str.data.split('#', 3);
            //var userRef = db().ref('/Users/' + data[1]).once('value');
            //var userData = userRef.val();
            AddFriend(data[0], data[1], data[2]).then(this.mainState(_friend_));
          }}
        />
      </SafeAreaView>
    )
  }
  // RENDER
  render() {
    switch (this.state.mainState) {
      case _loading_:
        return this.loadingView();
      case _friend_:
        return this.friendView();
      case _addFriend_:
        return this.addFriendView();
      case _createEvent_:
        return this.down4();
      case _scanning_:
        return this.scanningView();
      case _makeYourProfile_:
        return this.makeYourProfile();
      case _createQr_:
        return this.qrView();
      case _details_:
        return this.invitationsView();
      case _eventChat_:
        return this.eventChatView();
      case _camera_:
        return <GoodOlCamera callBack={(data) => { this.handleCameraData(data); this.mainState(this.state.previousState); }} />
      case _hyper_:
        return this.hyperView();
    }
  }
}

// STYLES ---------------------------------
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
