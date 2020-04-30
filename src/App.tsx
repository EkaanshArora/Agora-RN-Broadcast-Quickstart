/* eslint-disable prettier/prettier */
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
