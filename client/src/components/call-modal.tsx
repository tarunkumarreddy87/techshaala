import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video, Mic, MicOff, VideoOff, ScreenShare } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'audio' | 'video' | 'screen';
  participants: any[];
  localStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function CallModal({
  isOpen,
  onClose,
  callType,
  participants,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{[key: string]: HTMLVideoElement | null}>({});

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote streams to video elements
  useEffect(() => {
    // This would be implemented when we have remote streams
    // For now, we'll just log the participants
    console.log('Participants:', participants);
  }, [participants]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        {/* Call header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {callType === 'video' ? 'Video Call' : 
               callType === 'audio' ? 'Audio Call' : 'Screen Share'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {participants.length > 0 ? `${participants.length + 1} participants` : 'Connecting...'}
            </p>
          </div>
          <Button variant="destructive" size="icon" onClick={onEndCall}>
            <Phone className="h-5 w-5" />
          </Button>
        </div>

        {/* Video area */}
        <div className="flex-1 relative bg-black">
          {callType === 'video' && (
            <div className="grid grid-cols-2 gap-4 h-full p-4">
              {/* Local video */}
              <div className="relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                  You
                </div>
              </div>

              {/* Remote videos */}
              {participants.map((participant, index) => (
                <div key={participant.socketId} className="relative">
                  <video
                    ref={(el) => remoteVideoRefs.current[participant.socketId] = el}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                    {participant.userName}
                  </div>
                </div>
              ))}
            </div>
          )}

          {callType === 'audio' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Audio Call</h3>
                <p className="text-muted-foreground">
                  {participants.length > 0 ? `${participants.length + 1} participants` : 'Connecting...'}
                </p>
              </div>
            </div>
          )}

          {callType === 'screen' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ScreenShare className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Screen Sharing</h3>
                <p className="text-muted-foreground">Sharing your screen with participants</p>
              </div>
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="p-4 border-t flex justify-center items-center gap-4">
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="icon"
            onClick={onToggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {callType === 'video' && (
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={onToggleVideo}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="w-12 h-12"
            onClick={onEndCall}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}