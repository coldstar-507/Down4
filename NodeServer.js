
var admin = require("firebase-admin");

var serviceAccount = require("./down4-26ee1-firebase-adminsdk-im27t-8b74dd0397.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://down4-26ee1-default-rtdb.firebaseio.com/"
});

var msgs = admin.database().ref('/MessageRequests/');
var users = admin.database().ref('/Users/');

function ListenToMessageRequests() {
    console.log("Listening for messages requests...");
    msgs.on('child_added', async (newReq) => {
        var req = newReq.val();
        console.log("The request:", req);

        if (Array.isArray(req.to)) {
            var targets = [];
            req.to.forEach(userID => {
                users.child(userID).once('value').then(snapshot => targets.push(snapshot.val().current_token));
            });
            var message = { tokens: targets, data: req.data, notification: req.notification };
            admin.messaging().sendMulticast(message).then(response => { console.log("New message sent:", message); console.log("Response:", response); });
        } else {
            var snapshot = await users.child(req.to).once('value');
            var target = snapshot.val().current_token; console.log("Current_token:", target);
            var message = { token: target, data: req.data, notification: req.notification };
            console.log("Should've sent single message:", message);
            admin.messaging().send(message).then(response => { console.log("New message sent:", message); console.log("Response:", response); });
        }
    }, (error) => {
        console.log("Node server error:", error);
    });
}


ListenToMessageRequests();