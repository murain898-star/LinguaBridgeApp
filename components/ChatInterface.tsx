import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message } from '../types';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Lock, Mic, MicOff, Smile, Plus } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { cryptoService } from '../services/cryptoService';
import { userService } from '../services/userService';
import { startSpeechRecognition } from '../utils/speechUtils';

interface ChatInterfaceProps {
  currentUser: UserProfile;
  remoteUser: UserProfile;
  onBack: () => void;
  onStartCall: (video: boolean) => void;
}

// Sub-component to handle decryption asynchronously
const SecureMessageContent: React.FC<{ 
    content: string, 
    encryptedPackage?: string, 
    userPrivateKey: string | null,
    userId: string
}> = ({ content, encryptedPackage, userPrivateKey, userId }) => {
    const [decrypted, setDecrypted] = useState<string | null>(null);

    useEffect(() => {
        if (!encryptedPackage || !userPrivateKey) {
            setDecrypted(content); // Fallback to plain text if not encrypted
            return;
        }

        const decrypt = async () => {
            const text = await cryptoService.decryptData(encryptedPackage, userPrivateKey, userId);
            setDecrypted(text);
        };
        decrypt();
    }, [encryptedPackage, userPrivateKey, userId, content]);

    if (decrypted === null) return <span className="animate-pulse bg-gray-600/50 h-4 w-20 inline-block rounded"></span>;
    return <span>{decrypted}</span>;
};

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, remoteUser, onBack, onStartCall }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeSimulator, setActiveSimulator] = useState<'ME' | 'THEM'>('ME');
  const [encryptionStatus, setEncryptionStatus] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize keys on mount
  useEffect(() => {
    if (currentUser.publicKey && remoteUser.publicKey) {
        setEncryptionStatus(true);
    }
  }, [currentUser, remoteUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const processAndSendMessage = async (text: string, type: 'text' | 'voice' = 'text') => {
    const sender = activeSimulator === 'ME' ? currentUser : remoteUser;
    const receiver = activeSimulator === 'ME' ? remoteUser : currentUser;

    setIsTyping(true);

    // 1. Translate
    const translated = await translateText(
        text, 
        sender.language.name, 
        receiver.language.name
    );
    
    // 2. Encrypt
    const recipients = [];
    if (sender.publicKey) recipients.push({ userId: sender.id, publicKey: sender.publicKey });
    if (receiver.publicKey) recipients.push({ userId: receiver.id, publicKey: receiver.publicKey });

    let encryptedOriginal = '';
    let encryptedTranslated = '';

    if (recipients.length > 0) {
        encryptedOriginal = await cryptoService.encryptData(text, recipients);
        encryptedTranslated = await cryptoService.encryptData(translated, recipients);
    }

    setIsTyping(false);

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: sender.id,
      originalText: text,
      translatedText: translated,
      timestamp: Date.now(),
      isEncrypted: !!encryptedOriginal,
      encryptedOriginal,
      encryptedTranslated,
      type,
      reactions: {}
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await processAndSendMessage(text, 'text');
  };

  const handleRecordVoice = () => {
      if (isRecording) return;
      
      const sender = activeSimulator === 'ME' ? currentUser : remoteUser;
      setIsRecording(true);

      startSpeechRecognition(
        sender.language.ttsCode,
        async (text) => {
            setIsRecording(false);
            if (text) {
                await processAndSendMessage(text, 'voice');
            }
        },
        () => setIsRecording(false),
        (err) => {
            console.error("Voice recording error", err);
            setIsRecording(false);
            alert("Could not record voice. Please try again.");
        }
      );
  };

  const handleReaction = (messageId: string, emoji: string) => {
      setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
              const reactorId = activeSimulator === 'ME' ? currentUser.id : remoteUser.id;
              const currentReactions = msg.reactions || {};
              
              // Toggle reaction
              const newReactions = { ...currentReactions };
              if (newReactions[reactorId] === emoji) {
                  delete newReactions[reactorId];
              } else {
                  newReactions[reactorId] = emoji;
              }
              
              return { ...msg, reactions: newReactions };
          }
          return msg;
      }));
      setActiveReactionMessageId(null);
  };

  const toggleSimulator = () => {
    setActiveSimulator(prev => prev === 'ME' ? 'THEM' : 'ME');
  };

  // Get current viewer's private key (Always "ME" in this local view context)
  const myPrivateKey = userService.getPrivateKey(currentUser.id);

  return (
    <div className="h-screen bg-dark flex flex-col" onClick={() => setActiveReactionMessageId(null)}>
      {/* Header */}
      <div className="h-16 bg-surface/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src={remoteUser.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></span>
             </div>
             <div>
               <h2 className="font-semibold text-white flex items-center gap-2">
                   {remoteUser.name}
                   {encryptionStatus && <Lock size={12} className="text-green-500" />}
               </h2>
               <p className="text-xs text-gray-400 flex items-center gap-1">
                 {encryptionStatus ? 'E2E Encrypted' : 'Standard'} • {remoteUser.language.flag} {remoteUser.language.name}
               </p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => onStartCall(false)} className="p-2.5 bg-gray-800 hover:bg-primary text-gray-300 hover:text-white rounded-full transition-all">
             <Phone size={18} />
           </button>
           <button onClick={() => onStartCall(true)} className="p-2.5 bg-gray-800 hover:bg-primary text-gray-300 hover:text-white rounded-full transition-all">
             <Video size={18} />
           </button>
           <button className="p-2.5 hover:bg-white/10 rounded-full text-gray-400">
             <MoreVertical size={18} />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-dark to-slate-900">
         {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                 <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-2 relative">
                     <Lock size={32} className="opacity-50 text-green-500" />
                     <div className="absolute inset-0 border border-green-500/20 rounded-full animate-ping"></div>
                 </div>
                 <p className="font-medium text-gray-400">Messages are end-to-end encrypted.</p>
                 <p className="text-sm">Only you and {remoteUser.name} can read them.</p>
                 <div className="text-xs bg-surface/50 px-3 py-1 rounded-full border border-white/5">
                     Translation: {currentUser.language.flag} ↔ {remoteUser.language.flag}
                 </div>
             </div>
         )}
         
         {messages.map((msg) => {
             const isMe = msg.senderId === currentUser.id;
             const senderLang = isMe ? currentUser.language : remoteUser.language;
             
             return (
                 <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                     <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full relative group`}>
                         <div className={`max-w-[85%] md:max-w-[70%] relative`}>
                             {/* Message Bubble */}
                             <div className={`p-4 rounded-2xl shadow-lg relative ${
                                 isMe 
                                 ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-br-none' 
                                 : 'bg-surface border border-gray-700 text-gray-100 rounded-bl-none'
                             }`}>
                                 {/* Voice Indicator */}
                                 {msg.type === 'voice' && (
                                     <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 opacity-80 border-b border-white/10 pb-1">
                                         <Mic size={12} /> Voice Message
                                     </div>
                                 )}

                                 {/* Translated Text */}
                                 <div className="text-lg mb-1 leading-relaxed">
                                    <SecureMessageContent 
                                        content={msg.translatedText}
                                        encryptedPackage={msg.encryptedTranslated}
                                        userPrivateKey={myPrivateKey}
                                        userId={currentUser.id}
                                    />
                                 </div>
                                 
                                 {/* Original Text Metadata */}
                                 <div className={`text-xs border-t ${isMe ? 'border-white/20 text-blue-100' : 'border-gray-600 text-gray-400'} pt-2 mt-2 flex flex-col gap-1`}>
                                     <span className="uppercase tracking-wider font-bold text-[10px] flex items-center gap-1">
                                         Original ({senderLang.name})
                                         {msg.isEncrypted && <Lock size={8} />}
                                     </span>
                                     <span className="italic opacity-80">
                                        <SecureMessageContent 
                                            content={msg.originalText}
                                            encryptedPackage={msg.encryptedOriginal}
                                            userPrivateKey={myPrivateKey}
                                            userId={currentUser.id}
                                        />
                                     </span>
                                 </div>

                                 {/* Reaction Button (Visible on Hover/Click) */}
                                 <button 
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id);
                                     }}
                                     className={`absolute ${isMe ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity`}
                                 >
                                     <Smile size={16} />
                                 </button>
                                 
                                 {/* Reaction Picker Popover */}
                                 {activeReactionMessageId === msg.id && (
                                     <div className={`absolute z-10 bottom-full ${isMe ? 'right-0' : 'left-0'} mb-2 bg-gray-800 border border-gray-700 rounded-full shadow-xl p-1 flex items-center gap-1 animation-fade-in`}>
                                         {REACTIONS.map(emoji => (
                                             <button
                                                 key={emoji}
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     handleReaction(msg.id, emoji);
                                                 }}
                                                 className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-lg transition-colors"
                                             >
                                                 {emoji}
                                             </button>
                                         ))}
                                     </div>
                                 )}
                             </div>

                             {/* Reactions Display */}
                             {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                 <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                     {Object.entries(msg.reactions).map(([uid, emoji]) => (
                                         <span key={uid} className="bg-surface border border-gray-700 text-xs px-1.5 py-0.5 rounded-full shadow-sm" title={uid === currentUser.id ? 'You' : remoteUser.name}>
                                             {emoji}
                                         </span>
                                     ))}
                                 </div>
                             )}

                             <div className={`text-[10px] text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                                 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                             </div>
                         </div>
                     </div>
                 </div>
             );
         })}
         {isTyping && (
             <div className="flex justify-start">
                 <div className="bg-surface border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1">
                     <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                     <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                 </div>
             </div>
         )}
         <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface/90 border-t border-white/10 backdrop-blur-sm">
         {/* Simulator Toggle for Demo */}
         <div className="flex justify-center mb-3">
             <button 
                onClick={toggleSimulator}
                className="text-xs bg-black/40 text-gray-400 px-3 py-1 rounded-full hover:bg-black/60 transition-colors border border-white/5"
             >
                Simulating: <span className={activeSimulator === 'ME' ? 'text-primary font-bold' : 'text-secondary font-bold'}>
                    {activeSimulator === 'ME' ? 'You' : remoteUser.name}
                </span>
             </button>
         </div>

         <div className="flex items-end gap-2 max-w-4xl mx-auto">
             <button className="p-4 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                <Plus size={24} />
             </button>
             
             <div className="flex-1 bg-dark/50 border border-gray-600 rounded-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all flex items-center relative overflow-hidden">
                 <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder={isRecording ? "Listening..." : `Type in ${activeSimulator === 'ME' ? currentUser.language.name : remoteUser.language.name}...`}
                    disabled={isRecording}
                    className="flex-1 bg-transparent p-4 text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
                 />
                 {isRecording && (
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-red-500 animate-pulse">
                         <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                         <span className="text-xs font-bold uppercase">Recording</span>
                     </div>
                 )}
             </div>

             {inputText.trim() ? (
                 <button 
                    onClick={handleSendText}
                    className="p-4 bg-primary hover:bg-primary/90 rounded-full text-white shadow-lg transition-transform active:scale-95"
                 >
                    <Send size={24} />
                 </button>
             ) : (
                 <button 
                    onClick={handleRecordVoice}
                    disabled={isRecording}
                    className={`p-4 rounded-full shadow-lg transition-all active:scale-95 ${
                        isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                 >
                    {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                 </button>
             )}
         </div>
      </div>
    </div>
  );
};

export default ChatInterface;