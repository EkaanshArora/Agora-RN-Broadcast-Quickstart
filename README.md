# Agora React Native Broadcasting Demo

Quickstart for live-broadcasting on react-native using Agora.io SDK.
Use this guide to quickly start a multiple user live broadcast.


## Prerequisites
* '>= react native 0.55.x'
* iOS SDK 8.0+ (and a recent version of XCode and cocoapods)
* Android 5.0+ x86 arm64 armv7a
* A valid Agora account ([Sign up](https://dashboard.agora.io/) for free)

<div class="alert note">Open the specified ports in <a href="https://docs.agora.io/cn/Agora%20Platform/firewall?platform=All%20Platforms">Firewall Requirements</a> if your network has a firewall.</div>

## Running this example project

### Structure

```
.
├── android
├── ios
├── src
│ └── App.tsx
│ └── permission.js
│ └── Style.js
├── index.js
.
```

### Generate an App ID

In the next step, you need to use the App ID of your project. Follow these steps to [create an Agora project](https://docs.agora.io/en/Agora%20Platform/manage_projects?platform=All%20Platforms) in Console and get an [App ID](https://docs.agora.io/en/Agora%20Platform/terms?platform=All%20Platforms#a-nameappidaapp-id ).

1. Go to [Console](https://dashboard.agora.io/) and click the **[Project Management](https://dashboard.agora.io/projects)** icon on the left navigation panel. 
2. Click **Create** and follow the on-screen instructions to set the project name, choose an authentication mechanism (for this project select App ID without a certificate), and Click **Submit**. 
3. On the **Project Management** page, find the **App ID** of your project. 

Check the end of document if you want to use App ID with certificate.

### Steps to run our example

* Download and extract the zip file from the master branch.
* Run npm install or use yarn to install the app dependencies in the unzipped directory.
* Navigate to `./src/App.tsx` and edit line 13 to enter your App ID that we generated.
* Connect your device and run `react-native run-android` / `react-native run-ios` to start the app.

The app uses `channel-x` as the channel name.

## Understanding the code

### What we need
![Image of how a call works](flow.png?raw=true)

### Style.js
```javascript
import { StyleSheet, Dimensions } from 'react-native';

let dimensions = {                                //get dimensions of the device to use in view styles
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  };

export default StyleSheet.create({
    max: {
        flex: 1,
    },
    buttonHolder: {
        height: 60,
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingBottom: 10,
    },
    topHolder: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        height: 60,
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#0093E9',
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
    },
    fullView: {
        width: dimensions.width,
        height: dimensions.height - 140,
    },
    halfViewRow: {
        flex: 1 / 2,
        flexDirection: 'row',
    },
    full: {
        flex: 1,
    },
    half: {
        flex: 1 / 2,
    },
    localVideoStyle: {
        width: 120,
        height: 150,
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 100,
    },
    noUserText: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        color: '#0093E9',
    },
});
```
We have the styles for the view defined in a stylesheet inside Style.js

### Video.js

```javascript
import requestCameraAndAudioPermission from './permission';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import RtcEngine, { RtcLocalView, RtcRemoteView } from 'react-native-agora';
import styles from './Style';

const App: React.FC = () => {
  const LocalView = RtcLocalView.SurfaceView;
  const RemoteView = RtcRemoteView.SurfaceView;
  let engine = useRef<RtcEngine | null>(null);

  const appid: string = '9383ec2f56364d478cefc38b0a37d8bc';
  const channelName: string = 'channel-x';
  const [joinSucceed, setJoinSucceed] = useState<boolean>(false);
  const [peerIds, setPeerIds] = useState<Array<number>>([]);
  const [channelRole, setChannelRole] = useState<1 | 2>(1);
```
We write the used import statements and define our functional component. We extract components for Local and Remote view from the SDK. We define the engine object and add our app ID as well as the channel name. We set our state variables: appid is the agora app id used to authorize access to the sdk, channelName is used to join a channel (users on the same channel can view each other's feeds), joinSucceed which is used to check if we've successfully joined a channel and setup our view, peerIds is an array that stores the unique ID of connected peers used to display their videofeeds and channelRole which let's us pick between broadcasters and audience.
```javascript
...
  useEffect(() => {
    /**
     * @name init
     * @description Function to initialize the Rtc Engine, attach event listeners and actions
     */
    async function init() {
      if (Platform.OS === 'android') {
        //Request required permissions from Android
        await requestCameraAndAudioPermission();
      }
      engine.current = await RtcEngine.create(appid);
      engine.current.enableVideo();

      engine.current.addListener('UserJoined', (uid: number) => {
        //If user joins the channel
        setPeerIds((pids) =>
          pids.indexOf(uid) === -1 ? [...pids, uid] : pids,
        ); //add peer ID to state array
      });

      engine.current.addListener('UserOffline', (uid: number) => {
        //If user leaves
        setPeerIds((pids) => pids.filter((userId) => userId !== uid)); //remove peer ID from state array
      });

      engine.current.addListener('JoinChannelSuccess', () => {
        //If Local user joins RTC channel
        setJoinSucceed(true); //Set state variable to true
      });
    }
    init();
  }, []);
  ```
  We define our init function to initialize the Rtc Engine, attach event listeners and actions. We get permissions on Android. We create an instance of the Engine object. The RTC Engine fires events on user events, we define functions and add listeners to handle the logic for maintaing user's on the call. We update the peerIds array to store connected users' uids which is used to show their feeds. When a new user joins the call, we add their uid to the array. When user leaves the call, we remove their uid from the array; if the local users successfully joins the call channel, we start the stream preview.

```javascript
...
/**
   * @name startCall
   * @description Function to start the call
   */
  const startCall = () => {
    if (engine.current) {
      engine.current.joinChannel(null, channelName, null, 0); //Join Channel using null token and channel name
      engine.current.setClientRole(channelRole);              //Set client role after joining the channel
    }
  };

  /**
   * @name endCall
   * @description Function to end the call
   */
  const endCall = () => {
    if (engine.current) {
      engine.current.leaveChannel();
    }
    setPeerIds([]);
    setJoinSucceed(false);
  };

  /**
  * @name toggleRole
  * @description Function to toggle the user role ( Broadcaster / Audience )
  */
  const toggleRole = () => {
    if (engine.current) {
      channelRole === 2 ?
        (setChannelRole(1), engine.current.setClientRole(1))
        : (setChannelRole(2), engine.current.setClientRole(2));
    }
  };
```
We define functions to start and end the call, which we do by joining and leaving the channel and updating our state variables. We also define a function to toggle the role between audience and broadcaster .
```JSX
...
  return (
    <View style={styles.max}>
      {
        <View style={styles.max}>
          <View style={styles.topHolder}>
            <Text style={styles.noUserText}>You are {channelRole === 2 ? 'the Audience' : 'a Broadcaster'}</Text>
            <TouchableOpacity onPress={toggleRole} style={styles.button}>
              <Text style={styles.buttonText}> Toggle Role </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonHolder}>
            <TouchableOpacity onPress={startCall} style={styles.button}>
              <Text style={styles.buttonText}> Start Call </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={endCall} style={styles.button}>
              <Text style={styles.buttonText}> End Call </Text>
            </TouchableOpacity>
          </View>
          {
            !joinSucceed ?
              <View />
              :
              <View style={styles.fullView}>
                {
                  peerIds.length > 3                   //view for four videostreams
                    ? <View style={styles.full}>
                      <View style={styles.halfViewRow}>
                        <RemoteView
                          style={styles.half}
                          channelId={channelName}
                          uid={peerIds[0]}
                          renderMode={1}
                        />
                        <RemoteView
                          style={styles.half}
                          channelId={channelName}
                          uid={peerIds[1]}
                          renderMode={1}
                        />
                      </View>
                      <View style={styles.halfViewRow}>
                        <RemoteView
                          style={styles.half}
                          channelId={channelName}
                          uid={peerIds[2]}
                          renderMode={1}
                        />
                        <RemoteView
                          style={styles.half}
                          channelId={channelName}
                          uid={peerIds[3]}
                          renderMode={1}
                        />
                      </View>
                    </View>
                    : peerIds.length > 2                   //view for three videostreams
                      ? <View style={styles.full}>
                        <View style={styles.half}>
                          <RemoteView
                            style={styles.full}
                            channelId={channelName}
                            uid={peerIds[0]}
                            renderMode={1}
                          />
                        </View>
                        <View style={styles.halfViewRow}>
                          <RemoteView
                            style={styles.half}
                            channelId={channelName}
                            uid={peerIds[1]}
                            renderMode={1}
                          />
                          <RemoteView
                            style={styles.half}
                            channelId={channelName}
                            uid={peerIds[2]}
                            renderMode={1}
                          />
                        </View>
                      </View>
                      : peerIds.length > 1                   //view for two videostreams
                        ? <View style={styles.full}>
                          <RemoteView
                            style={styles.full}
                            channelId={channelName}
                            uid={peerIds[0]}
                            renderMode={1}
                          />
                          <RemoteView
                            style={styles.full}
                            channelId={channelName}
                            uid={peerIds[1]}
                            renderMode={1}
                          />
                        </View>
                        : peerIds.length > 0                   //view for videostream
                          ? <RemoteView
                            style={styles.full}
                            channelId={channelName}
                            uid={peerIds[0]}
                            renderMode={1}
                          />
                          : <View>
                            <Text style={styles.noUserText}> No Broadcaster connected </Text>
                          </View>
                }
                {
                  channelRole === 1 ?
                    <LocalView
                      style={styles.localVideoStyle}
                      channelId={channelName}
                      renderMode={1}
                      zOrderMediaOverlay={true}
                    />
                    : <></>
                }
              </View>
          }
        </View>
      }
    </View>
  );
};

export default App;
```
Next we define the view for different possible number of users; we start with 4 external users on the channel (diving the screen into four views using flexbox for four users) and move down to no connected users using conditional operator. Inside each view we use an RemoteView component, for viewing remote streams we set the `channelId={channelName}`, the `uid={'RemoteUidGoesHere'}` and the `mode` to select how the video is displayed in our view. For viewing the local user's stream we use LocalView component.

### permission.js
```javascript
import { PermissionsAndroid } from "react-native";
/**
 * @name requestCameraAndAudioPermission
 * @description Function to request permission for Audio and Camera
 */
export default async function requestCameraAndAudioPermission() {
	try {
		const granted = await PermissionsAndroid.requestMultiple([
			PermissionsAndroid.PERMISSIONS.CAMERA,
			PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
		]);
		if (
			granted["android.permission.RECORD_AUDIO"] ===
			PermissionsAndroid.RESULTS.GRANTED &&
			granted["android.permission.CAMERA"] ===
			PermissionsAndroid.RESULTS.GRANTED
		) {
			console.log("You can use the cameras & mic");
		} else {
			console.log("Permission denied");
		}
	} catch (err) {
		console.warn(err);
	}
}
```
We have permission.js containing an async function to request permission from the OS on Android to use the camera and microphone.

### Using App ID with certificate

You can use an App ID with a certificate by making the following changes in the project:

In `Home.js` define your token in the state as `token: *insert your token here*`

In `Video.js` add `token: this.props.token` to your state and edit the `joinChannel` method to use the token like this: `RtcEngine.joinChannel(this.state.channelName, this.state.uid, `**`this.state.token`**`);`