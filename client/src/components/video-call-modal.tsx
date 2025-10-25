import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Video, Mic, MicOff, PhoneOff, ScreenShare, ScreenShareOff } from "lucide-react";
import SocketClient from "@/lib/socket";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'voice' | 'video';
  callerName: string;
  calleeId: string;
  onCallEnd: () => void;
  isCaller: boolean;
  callerId: string;
}

export function VideoCallModal({ 
  isOpen, 
  onClose, 
  callType, 
  callerName,
  calleeId,
  onCallEnd,
  isCaller,
  callerId
}: VideoCallModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const currentUserId = isCaller ? callerId : calleeId;
  const otherUserId = isCaller ? calleeId : callerId;
  
  // Initialize WebRTC
  useEffect(() => {
    if (!isOpen) return;
    
    const initWebRTC = async () => {
      try {
        // Create peer connection
        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        };
        
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;
        
        // Get local media stream
        const constraints = {
          video: callType === 'video',
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          setCallStatus('connected');
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            SocketClient.emit('message', {
              type: 'ICE_CANDIDATE',
              candidate: event.candidate,
              targetUserId: otherUserId,
              senderId: currentUserId
            });
          }
        };
        
        // If we're the caller, create offer
        if (isCaller) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          SocketClient.emit('message', {
            type: 'CALL_OFFER',
            offer: offer,
            targetUserId: otherUserId,
            senderId: currentUserId
          });
        }
        
        setCallStatus('connecting');
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        setError('Failed to access camera/microphone. Please check permissions.');
      }
    };
    
    initWebRTC();
    
    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isOpen, callType, calleeId, isCaller, callerId]);
  
  // Handle incoming WebRTC messages
  useEffect(() => {
    if (!isOpen) return;
    
    const handleOffer = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.senderId === otherUserId) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          SocketClient.emit('message', {
            type: 'CALL_ANSWER',
            answer: answer,
            targetUserId: otherUserId,
            senderId: currentUserId
          });
          
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('Error handling offer:', error);
        setError('Failed to handle call offer');
      }
    };
    
    const handleAnswer = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.senderId === otherUserId) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('Error handling answer:', error);
        setError('Failed to handle call answer');
      }
    };
    
    const handleIceCandidate = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.candidate && data.senderId === otherUserId) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };
    
    SocketClient.on('CALL_OFFER', handleOffer);
    SocketClient.on('CALL_ANSWER', handleAnswer);
    SocketClient.on('ICE_CANDIDATE', handleIceCandidate);
    
    return () => {
      SocketClient.off('CALL_OFFER', handleOffer);
      SocketClient.off('CALL_ANSWER', handleAnswer);
      SocketClient.off('ICE_CANDIDATE', handleIceCandidate);
    };
  }, [isOpen, calleeId, isCaller, callerId]);
  
  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);
  
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoOff(!videoTracks[0].enabled);
      }
    }
  };
  
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        
        // Replace video track in peer connection
        if (peerConnectionRef.current && localStream) {
          const screenTrack = screenStream.getVideoTracks()[0];
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
          
          // Handle screen sharing ended
          screenTrack.onended = () => {
            setIsScreenSharing(false);
            // Restore camera stream
            if (localStream) {
              const videoTracks = localStream.getVideoTracks();
              if (videoTracks.length > 0 && peerConnectionRef.current) {
                const senders = peerConnectionRef.current.getSenders();
                const videoSender = senders.find(sender => sender.track?.kind === 'video');
                if (videoSender) {
                  videoSender.replaceTrack(videoTracks[0]);
                }
              }
            }
          };
        }
      } else {
        // Stop screen sharing and restore camera
        if (localStream) {
          const videoTracks = localStream.getVideoTracks();
          if (videoTracks.length > 0 && peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTracks[0]);
            }
          }
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      setError('Failed to share screen');
    }
  };
  
  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Notify other user
    SocketClient.emit('message', {
      type: 'CALL_ENDED',
      targetUserId: otherUserId,
      senderId: currentUserId
    });
    
    setCallStatus('disconnected');
    onCallEnd();
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        {/* Call header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {callType === 'video' ? 'Video Call' : 'Voice Call'} with {callerName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {callStatus === 'connecting' ? 'Connecting...' : 
               callStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <Button variant="destructive" size="icon" onClick={endCall}>
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive text-center">
            {error}
          </div>
        )}
        
        {/* Video area */}
        <div className="flex-1 relative bg-black">
          {/* Remote video */}
          {callType === 'video' && remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Local video (picture-in-picture) */}
          {callType === 'video' && localStream && (
            <div className="absolute bottom-4 right-4 w-32 h-24 border-2 border-white rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Voice call placeholder */}
          {callType === 'voice' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{callerName}</h3>
                <p className="text-muted-foreground">
                  {callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
                </p>
              </div>
            </div>
          )}
          
          {/* Connection status overlay */}
          {callStatus === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-white">Connecting to {callerName}...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Call controls */}
        <div className="p-4 border-t flex justify-center items-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          {callType === 'video' && (
            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoOff ? <Video className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
          )}
          
          {callType === 'video' && (
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="icon"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
            </Button>
          )}
          
          <Button
            variant="destructive"
            size="icon"
            className="w-12 h-12"
            onClick={endCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}