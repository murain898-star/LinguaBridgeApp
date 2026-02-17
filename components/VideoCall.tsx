import React, { useRef, useState, useEffect, useCallback } from 'react';
import { UserProfile, Message } from '../types';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Globe, Volume2, Wifi } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { startSpeechRecognition, speakText } from '../utils/speechUtils';

interface VideoCallProps {
  currentUser: UserProfile;
  remoteUser: UserProfile;
  onEndCall: () => void;
  isVideoEnabled: boolean;
}

// Mock video for the remote user to simulate a real call experience
const REMOTE_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-on-laptop-at-home-41334-large.mp4";

const VideoCall: React.FC<VideoCallProps> = ({ currentUser, remoteUser, onEndCall, isVideoEnabled }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListeningLocal, setIsListeningLocal] = useState(false);
  const [isListeningRemote, setIsListeningRemote] = useState(false);
  
  // Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(isVideoEnabled);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callStatus, setCallStatus] = useState<'CONNECTING' | 'CONNECTED'>('CONNECTING');
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize Camera & Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startMedia = async () => {
      try {
        // Request both audio and video
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setLocalStream(stream);

        // Initial Track Configuration
        stream.getVideoTracks().forEach(track => track.enabled = isVideoEnabled);
        stream.getAudioTracks().forEach(track => track.enabled = !isMuted);

        // Attach to local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection delay
        setTimeout(() => {
          setCallStatus('CONNECTED');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.play().catch(e => console.log("Autoplay prevented", e));
          }
        }, 1500);

      } catch (err) {
        console.error("Media access denied or not available", err);
        setCameraOn(false);
      }
    };

    startMedia();

    return () => {
      // Cleanup tracks on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Camera Toggle
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraOn;
        setCameraOn(!cameraOn);
      }
    }
  };

  // Handle Mic Toggle
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted; // Toggle: if currently muted (true), new state is unmuted (true)
        setIsMuted(!isMuted);
      }
    }
  };

  const handleSpeak = useCallback((speaker: 'LOCAL' | 'REMOTE') => {
    const sourceUser = speaker === 'LOCAL' ? currentUser : remoteUser;
    const targetUser = speaker === 'LOCAL' ? remoteUser : currentUser;
    const setListening = speaker === 'LOCAL' ? setIsListeningLocal : setIsListeningRemote;

    setListening(true);

    startSpeechRecognition(
      sourceUser.language.ttsCode,
      async (text) => {
        setListening(false);
        if (!text) return;
        
        setIsProcessing(true);

        // Translate
        const translated = await translateText(
            text, 
            sourceUser.language.name, 
            targetUser.language.name
        );
        
        setIsProcessing(false);

        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: sourceUser.id,
          originalText: text,
          translatedText: translated,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, newMessage]);

        // Auto speak
        speakText(translated, targetUser.language.ttsCode);
      },
      () => setListening(false),
      (err) => {
        console.error(err);
        setListening(false);
      }
    );
  }, [currentUser, remoteUser]);

  return (
    <div className="flex flex-col h-screen bg-dark text-white overflow-hidden relative">
      
      {/* Main Content Area - Split View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1 p-2 md:p-4">
        
        {/* Local User Panel (You) */}
        <div className="relative bg-surface rounded-2xl overflow-hidden border border-gray-700 flex flex-col group">
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
             {/* Actual Video Element */}
             <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover transform scale-x-[-1] ${!cameraOn ? 'hidden' : ''}`} 
             />
             
             {/* Fallback when camera is off */}
             {!cameraOn && (
                <div className="flex flex-col items-center gap-4 text-gray-500 animate-pulse">
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                        <img src={currentUser.avatar} alt="You" className="w-full h-full rounded-full opacity-50" />
                    </div>
                    <p>Camera Off</p>
                </div>
             )}
          </div>
          
          {/* Overlay UI */}
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${cameraOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="font-medium text-sm">You {isMuted && '(Muted)'}</span>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
                onClick={() => handleSpeak('LOCAL')}
                disabled={isListeningLocal || isListeningRemote || isProcessing}
                className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 ${
                  isListeningLocal 
                    ? 'bg-red-500 animate-pulse cursor-wait' 
                    : isProcessing 
                    ? 'bg-gray-500 cursor-wait'
                    : 'bg-primary hover:bg-primary/90'
                }`}
             >
                {isListeningLocal ? <MicOff size={20} /> : <Mic size={20} />}
                {isListeningLocal ? 'Listening...' : isProcessing ? 'Translating...' : 'Speak Now'}
             </button>
          </div>
        </div>

        {/* Remote User Panel */}
        <div className="relative bg-surface rounded-2xl overflow-hidden border border-gray-700 flex flex-col group">
           {/* Remote Video Stream (Simulated) */}
           <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              {callStatus === 'CONNECTED' ? (
                <video 
                  ref={remoteVideoRef}
                  src={REMOTE_VIDEO_URL}
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-indigo-900/50 flex items-center justify-center relative overflow-hidden animate-pulse">
                      <img src={remoteUser.avatar} alt="Partner" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Wifi size={16} className="animate-pulse" /> Connecting...
                  </p>
                </div>
              )}
           </div>

           {/* Overlay UI */}
           <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${callStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="font-medium text-sm">{remoteUser.name}</span>
          </div>

          {/* Simulation Button */}
          {callStatus === 'CONNECTED' && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                  onClick={() => handleSpeak('REMOTE')}
                  disabled={isListeningLocal || isListeningRemote || isProcessing}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 ${
                    isListeningRemote 
                      ? 'bg-red-500 animate-pulse cursor-wait' 
                      : isProcessing 
                      ? 'bg-gray-500 cursor-wait'
                      : 'bg-secondary hover:bg-secondary/90'
                  }`}
              >
                  {isListeningRemote ? <MicOff size={20} /> : <Mic size={20} />}
                  {isListeningRemote ? 'Listening...' : isProcessing ? 'Translating...' : `Simulate Reply`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Transcript / Subtitles Overlay */}
      <div className="h-48 bg-black/80 backdrop-blur-md border-t border-white/10 p-4 overflow-y-auto">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-black/80 pb-2">Live Translation Transcript</h3>
        <div className="space-y-3">
            {messages.length === 0 && (
                <div className="text-center text-gray-600 italic mt-4">
                  <p>Conversation started...</p>
                  <p className="text-xs mt-1">Speak to see real-time translations.</p>
                </div>
            )}
            {messages.map((msg) => {
                const isLocal = msg.senderId === currentUser.id;
                return (
                    <div key={msg.id} className={`flex flex-col ${isLocal ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] rounded-xl p-3 ${
                            isLocal 
                            ? 'bg-primary/20 border border-primary/30 rounded-bl-none' 
                            : 'bg-secondary/20 border border-secondary/30 rounded-br-none'
                        }`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold opacity-70">
                                    {isLocal ? 'You' : remoteUser.name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm opacity-60 mb-1 font-mono">{msg.originalText}</p>
                            <p className="text-lg font-medium text-white flex items-center gap-2">
                                {msg.translatedText}
                                <Volume2 
                                    size={14} 
                                    className="cursor-pointer hover:text-primary" 
                                    onClick={() => speakText(msg.translatedText, isLocal ? remoteUser.language.ttsCode : currentUser.language.ttsCode)}
                                />
                            </p>
                        </div>
                    </div>
                );
            })}
            <div id="scroll-anchor"></div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-gray-900 border-t border-white/10 flex items-center justify-center gap-6 z-50">
         <button 
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title={isMuted ? "Unmute" : "Mute"}
         >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
         </button>

         <button 
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-all ${!cameraOn ? 'bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
         >
            {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
         </button>

         <button 
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transform hover:scale-110 transition-all"
            title="End Call"
         >
            <PhoneOff size={28} />
         </button>
         
         <div className="w-px h-8 bg-gray-700 mx-2"></div>
         
         <div className="flex flex-col items-center text-xs text-gray-500">
             <Globe size={16} className="mb-1" />
             <span>AI Translate Active</span>
         </div>
      </div>
    </div>
  );
};

export default VideoCall;
