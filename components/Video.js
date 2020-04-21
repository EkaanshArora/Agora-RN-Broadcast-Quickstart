/* eslint-disable prettier/prettier */
import requestCameraAndAudioPermission from './permission';
import React, { Component } from 'react';
import { View, NativeModules, Text, TouchableOpacity, Platform } from 'react-native';
import { RtcEngine, AgoraView } from 'react-native-agora';
import styles from './Style';

const { Agora } = NativeModules;            //Define Agora object as a native module

const {
  FPS30,
  AudioProfileDefault,
  AudioScenarioDefault,
  Adaptative,
} = Agora;                                  //Set defaults for Stream

const config = {                            //Setting config of the app
  appid: 'ENTER APP ID HERE',               //Enter the App ID generated from the Agora Website
  channelProfile: 1,                        //Set channel profile as 1 for live broadcasting
  videoEncoderConfig: {                     //Set Video feed encoder settings
    width: 720,
    height: 1080,
    bitrate: 1,
    frameRate: FPS30,
    orientationMode: Adaptative,
  },
  clientRole: 1,
  audioProfile: AudioProfileDefault,
  audioScenario: AudioScenarioDefault,
};

class Video extends Component {

  constructor(props) {
    super(props);
    this.state = {
      peerIds: [],                                       //Array for storing connected peers
      uid: Math.floor(Math.random() * 100),              //Generate a UID for local user
      appid: config.appid,
      channelName: 'channel-x',                        //Channel Name for the current session
      joinSucceed: false,                              //State variable for storing success
      channelRole: 1,                                  //Channel Role for local user - 1: Broadcaster and 0: Audience
    };
    if (Platform.OS === 'android') {                   //Request required permissions from Android
      requestCameraAndAudioPermission().then(_ => {
        console.log('requested!');
      });
    }
  }

  componentDidMount() {
    RtcEngine.on('userJoined', (data) => {
      const { peerIds } = this.state;                   //Get currrent peer IDs
      if (peerIds.indexOf(data.uid) === -1) {           //If new user has joined
        this.setState({
          peerIds: [...peerIds, data.uid],              //add peer ID to state array
        });
      }
    });

    RtcEngine.on('userOffline', (data) => {             //If user leaves
      this.setState({
        peerIds: this.state.peerIds.filter(uid => uid !== data.uid), //Remove peer ID from state array
      });
    });


    RtcEngine.on('joinChannelSuccess', (data) => {                   //If Local user joins RTC channel
      RtcEngine.startPreview();                                      //Start RTC preview
      this.setState({
        joinSucceed: true,                                           //Set state variable to true
      });
    });

    RtcEngine.on('clientRoleChanged',(data) => {
      // console.log(data);                             //Callback for when client role is changed by anyone on stream
    });

    RtcEngine.init(config);                                         //Initialize the RTC engine
  }

  componentWillUnmount() {
    RtcEngine.destroy();
  }

  /**
  * @name startCall
  * @description Function to start the call
  */
  startCall = () => {
    RtcEngine.setClientRole(this.state.channelRole);
    RtcEngine.joinChannel(this.state.channelName, this.state.uid);  //Join Channel
    RtcEngine.enableAudio();                                        //Enable the audio
  }

  /**
  * @name endCall
  * @description Function to end the call
  */
  endCall = () => {
    RtcEngine.leaveChannel();
    this.setState({
      peerIds: [],
      joinSucceed: false,
    });
  }

  /**
  * @name toggleRole
  * @description Function to toggle the user role ( Broadcaster / Audience )
  */
  toggleRole = () => {
    this.state.channelRole === 2 ?
      (this.setState({ channelRole: 1 }), RtcEngine.setClientRole(1))
      : (this.setState({ channelRole: 2 }), RtcEngine.setClientRole(2));
  }

  /**
  * @name videoView
  * @description Function to return the view for the app
  */
  videoView() {
    return (
      <View style={styles.max}>
        {
          <View style={styles.max}>
          <View style={styles.topHolder}>
              <Text style={styles.noUserText}>You are {this.state.channelRole === 2 ? 'the Audience' : 'a Broadcaster'}</Text>
          <TouchableOpacity title="ToggleRole" onPress={() => this.toggleRole()} style={styles.button}>
            <Text style={styles.buttonText}> Toggle Role </Text>
          </TouchableOpacity>
          </View>
            <View style={styles.buttonHolder}>
              <TouchableOpacity title="Start Call" onPress={() => this.startCall()} style={styles.button}>
                <Text style={styles.buttonText}> Start Call </Text>
              </TouchableOpacity>
              <TouchableOpacity title="End Call" onPress={this.endCall} style={styles.button}>
                <Text style={styles.buttonText}> End Call </Text>
              </TouchableOpacity>
            </View>
            {
              !this.state.joinSucceed ?
                <View />
                :
                <View style={styles.fullView}>
                  {
                    this.state.peerIds.length > 3                   //view for four videostreams
                      ? <View style={styles.full}>
                        <View style={styles.halfViewRow}>
                          <AgoraView style={styles.half}
                            remoteUid={this.state.peerIds[0]} mode={1} />
                          <AgoraView style={styles.half}
                            remoteUid={this.state.peerIds[1]} mode={1} />
                        </View>
                        <View style={styles.halfViewRow}>
                          <AgoraView style={styles.half}
                            remoteUid={this.state.peerIds[2]} mode={1} />
                          <AgoraView style={styles.half}
                            remoteUid={this.state.peerIds[3]} mode={1} />
                        </View>
                      </View>
                      : this.state.peerIds.length > 2                   //view for three videostreams
                        ? <View style={styles.full}>
                          <View style={styles.half}>
                            <AgoraView style={styles.full}
                              remoteUid={this.state.peerIds[0]} mode={1} />
                          </View>
                          <View style={styles.halfViewRow}>
                            <AgoraView style={styles.half}
                              remoteUid={this.state.peerIds[1]} mode={1} />
                            <AgoraView style={styles.half}
                              remoteUid={this.state.peerIds[2]} mode={1} />
                          </View>
                        </View>
                        : this.state.peerIds.length > 1                   //view for two videostreams
                          ? <View style={styles.full}>
                            <AgoraView style={styles.full}
                              remoteUid={this.state.peerIds[0]} mode={1} />
                            <AgoraView style={styles.full}
                              remoteUid={this.state.peerIds[1]} mode={1} />
                          </View>
                          : this.state.peerIds.length > 0                   //view for videostream
                            ? <AgoraView style={styles.full}
                              remoteUid={this.state.peerIds[0]} mode={1} />
                            : <View>
                              <Text style={styles.noUserText}> No Broadcaster connected </Text>
                            </View>
                  }
                  {
                    this.state.channelRole === 1 ?
                      <AgoraView style={styles.localVideoStyle}
                        zOrderMediaOverlay={true} showLocalVideo={true} mode={1} />
                      : <></>
                  }
                </View>
            }
          </View>
        }
      </View>
    );
  }
  render() {
    return this.videoView();
  }
}
export default Video;
