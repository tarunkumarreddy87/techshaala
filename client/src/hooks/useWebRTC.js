import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

export const useWebRTC = (courseId, userId, userName) => {
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' | 'video' | 'screen'
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const socketRef = useRef();
  const peerConnections = useRef({});
  const localVideoRef = useRef();

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('user-joined', handleUserJoined);
    socketRef.current.on('existing-participants', handleExistingParticipants);
    socketRef.current.on('call-offer', handleCallOffer);
    socketRef.current.on('call-answer', handleCallAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);
    socketRef.current.on('user-left', handleUserLeft);
    socketRef.current.on('user-audio-toggle', handleUserAudioToggle);
    socketRef.current.on('user-video-toggle', handleUserVideoToggle);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const createPeerConnection = useCallback((peerId) => {
    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', peerId);
      setPeers(prev => ({
        ...prev,
        [peerId]: event.streams[0]
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          courseId,
          candidate: event.candidate,
          to: peerId
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        handleUserLeft({ socketId: peerId });
      }
    };

    peerConnections.current[peerId] = peerConnection;
    return peerConnection;
  }, [localStream, courseId]);

  const handleUserJoined = async ({ userId: remoteUserId, userName: remoteUserName, callType: remoteCallType, socketId }) => {
    console.log('User joined:', remoteUserName, socketId);
    
    const peerConnection = createPeerConnection(socketId);
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketRef.current.emit('call-offer', {
        courseId,
        offer,
        to: socketId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleExistingParticipants = (participants) => {
    console.log('Existing participants:', participants);
    // Existing participants will send offers to the new user
  };

  const handleCallOffer = async ({ offer, from }) => {
    console.log('Received offer from:', from);
    
    const peerConnection = createPeerConnection(from);
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socketRef.current.emit('call-answer', {
        courseId,
        answer,
        to: from
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleCallAnswer = async ({ answer, from }) => {
    console.log('Received answer from:', from);
    
    const peerConnection = peerConnections.current[from];
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  };

  const handleIceCandidate = async ({ candidate, from }) => {
    const peerConnection = peerConnections.current[from];
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const handleUserLeft = ({ socketId }) => {
    console.log('User left:', socketId);
    
    if (peerConnections.current[socketId]) {
      peerConnections.current[socketId].close();
      delete peerConnections.current[socketId];
    }
    
    setPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[socketId];
      return newPeers;
    });
  };

  const handleUserAudioToggle = ({ socketId, enabled }) => {
    console.log(`User ${socketId} audio:`, enabled);
    // Update UI to show mute status
  };

  const handleUserVideoToggle = ({ socketId, enabled }) => {
    console.log(`User ${socketId} video:`, enabled);
    // Update UI to show video off status
  };

  // Start audio call
  const startAudioCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      
      setLocalStream(stream);
      setCallType('audio');
      setIsCallActive(true);
      
      // Join the call room
      socketRef.current.emit('join-call', {
        courseId,
        userId,
        userName,
        callType: 'audio'
      });
    } catch (error) {
      console.error('Error starting audio call:', error);
    }
  };

  // Start video call
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: true
      });
      
      setLocalStream(stream);
      setCallType('video');
      setIsCallActive(true);
      
      // Join the call room
      socketRef.current.emit('join-call', {
        courseId,
        userId,
        userName,
        callType: 'video'
      });
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  };

  // Start screen share
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true
      });
      
      setLocalStream(stream);
      setCallType('screen');
      setIsCallActive(true);
      
      // Notify others about screen share
      socketRef.current.emit('screen-share-started', {
        courseId,
        userId
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsAudioEnabled(audioTracks[0].enabled);
        
        // Notify others
        socketRef.current.emit('toggle-audio', {
          courseId,
          userId,
          enabled: audioTracks[0].enabled
        });
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoEnabled(videoTracks[0].enabled);
        
        // Notify others
        socketRef.current.emit('toggle-video', {
          courseId,
          userId,
          enabled: videoTracks[0].enabled
        });
      }
    }
  };

  // End call
  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    
    // Clear peers
    setPeers({});
    
    // Leave call room
    socketRef.current.emit('leave-call', {
      courseId,
      userId
    });
    
    setIsCallActive(false);
    setCallType(null);
  };

  return {
    peers,
    localStream,
    isCallActive,
    callType,
    isAudioEnabled,
    isVideoEnabled,
    localVideoRef,
    startAudioCall,
    startVideoCall,
    startScreenShare,
    toggleAudio,
    toggleVideo,
    endCall
  };
};