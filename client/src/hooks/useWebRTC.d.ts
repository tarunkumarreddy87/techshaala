declare module '@/hooks/useWebRTC' {
  import { MediaStream } from 'react';

  export interface UseWebRTCReturn {
    peers: Record<string, MediaStream>;
    localStream: MediaStream | null;
    isCallActive: boolean;
    callType: 'audio' | 'video' | 'screen' | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    localVideoRef: React.RefObject<HTMLVideoElement>;
    startAudioCall: () => Promise<void>;
    startVideoCall: () => Promise<void>;
    startScreenShare: () => Promise<void>;
    toggleAudio: () => void;
    toggleVideo: () => void;
    endCall: () => void;
  }

  export function useWebRTC(courseId: string, userId: string, userName: string): UseWebRTCReturn;
}