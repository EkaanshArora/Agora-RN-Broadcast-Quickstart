import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RtcEngine, {
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
  ChannelProfile,
  ClientRole
} from 'react-native-agora';

import requestCameraAndAudioPermission from './components/Permission';
import styles from './components/Style';

const config = {
  appId: YourAgoraAppID,
  token: YourChannelTokenOrNull,
  channelName: 'channel-x',
};

const App = () => {
  const _engine = useRef<RtcEngine | null>(null);
  const [isJoined, setJoined] = useState(false);
  const [peerIds, setPeerIds] = useState<number[]>([]);
  const [isHost, setHost] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Request required permissions from Android
      requestCameraAndAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }, []);

  useEffect(() => {
    /**
     * @name init
     * @description Function to initialize the Rtc Engine, attach event listeners and actions
     */
    const init = async () => {
      const { appId } = config;
      _engine.current = await RtcEngine.create(appId);
      await _engine.current.enableVideo();
      await _engine.current.setChannelProfile(ChannelProfile.LiveBroadcasting);
      await _engine.current.setClientRole(
        isHost ? ClientRole.Broadcaster : ClientRole.Audience
      );

      _engine.current.addListener('Warning', (warn) => {
        console.log('Warning', warn);
      });

      _engine.current.addListener('Error', (err) => {
        console.log('Error', err);
      });

      _engine.current.addListener('UserJoined', (uid, elapsed) => {
        console.log('UserJoined', uid, elapsed);
        // If new user
        if (peerIds.indexOf(uid) === -1) {
          // Add peer ID to state array
          setPeerIds((prev) => [...prev, uid]);
        }
      });

      _engine.current.addListener('UserOffline', (uid, reason) => {
        console.log('UserOffline', uid, reason);
        // Remove peer ID from state array
        setPeerIds((prev) => prev.filter((id) => id !== uid));
      });

      // If Local user joins RTC channel
      _engine.current.addListener(
        'JoinChannelSuccess',
        (channel, uid, elapsed) => {
          console.log('JoinChannelSuccess', channel, uid, elapsed);
          // Set state variable to true
          setJoined(true);
        }
      );
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * @name toggleRoll
   * @description Function to toggle the roll between broadcaster and audience
   */
   const toggleRoll = async () => {
    await _engine.current?.setClientRole(
      isHost ? ClientRole.Audience : ClientRole.Broadcaster
    ).then(()=>{
      setHost(prev => !prev)
    })
  };

  /**
   * @name startCall
   * @description Function to start the call
   */
  const startCall = async () => {
    // Join Channel using null token and channel name
    await _engine.current?.joinChannel(
      config.token,
      config.channelName,
      null,
      0
    );
  };

  /**
   * @name endCall
   * @description Function to end the call
   */
  const endCall = async () => {
    await _engine.current?.leaveChannel();
    setPeerIds([]);
    setJoined(false);
  };

  const _renderVideos = () => {
    return isJoined ? (
      <View style={styles.fullView}>
        {isHost &&
          <RtcLocalView.SurfaceView
            style={styles.max}
            channelId={config.channelName}
            renderMode={VideoRenderMode.Hidden}
          />
        }
        {_renderRemoteVideos()}
      </View>
    ) : null;
  };

  const _renderRemoteVideos = () => {
    return (
      <ScrollView
        style={styles.remoteContainer}
        contentContainerStyle={styles.remoteContainerContent}
        horizontal={true}
      >
        {peerIds.map((value) => {
          return (
            <RtcRemoteView.SurfaceView
              style={styles.remote}
              uid={value}
              key={value}
              channelId={config.channelName}
              renderMode={VideoRenderMode.Hidden}
              zOrderMediaOverlay={true}
            />
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.max}>
      <View style={styles.max}>
        <Text style={styles.roleText}>
          You're {isHost ? 'a broadcaster' : 'the audience'}
        </Text>
        <View style={styles.buttonHolder}>
          <TouchableOpacity onPress={startCall} style={styles.button}>
            <Text style={styles.buttonText}> Start Call </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleRoll} style={styles.button}>
            <Text style={styles.buttonText}> Toggle Role </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={endCall} style={styles.button}>
            <Text style={styles.buttonText}> End Call </Text>
          </TouchableOpacity>
        </View>
        {_renderVideos()}
      </View>
    </View>
  );
};

export default App;
