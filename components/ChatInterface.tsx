import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message } from '../types';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { translateText } from '../services/geminiService';

interface ChatInterfaceProps {
  currentUser: UserProfile;
  remoteUser: UserProfile;
  onBack: () => void;
  onStartCall: (video: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, remoteUser, onBack, onStartCall }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSimulator, setActiveSimulator] = useState<'ME' | 'THEM'>('ME'); // Simulator for demo
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Determine who is sending (for demo simulation purposes)
    const sender = activeSimulator === 'ME' ? currentUser : remoteUser;
    const receiver = activeSimulator === 'ME' ? remoteUser : currentUser;

    const original = inputText;
    setInputText('');
    setIsTyping(true);

    // Translate from Sender's language to Receiver's language
    const translated = await translateText(
        original, 
        sender.language.name, 
        receiver.language.name
    );
    
    setIsTyping(false);

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: sender.id,
      originalText: original,
      translatedText: translated,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Auto toggle for demo flow
    // setActiveSimulator(prev => prev === 'ME' ? 'THEM' : 'ME');
  };

  const toggleSimulator = () => {
    setActiveSimulator(prev => prev === 'ME' ? 'THEM' : 'ME');
  };

  return (
    <div className="h-screen bg-dark flex flex-col">
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
               <h2 className="font-semibold text-white">{remoteUser.name}</h2>
               <p className="text-xs text-gray-400 flex items-center gap-1">
                 Speaks {remoteUser.language.flag} {remoteUser.language.name} • AI Active
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
                 <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-2">
                     <Send size={32} className="opacity-50" />
                 </div>
                 <p>Send a message to start translating.</p>
                 <div className="text-xs bg-surface/50 px-3 py-1 rounded-full border border-white/5">
                     Translation: {currentUser.language.flag} ↔ {remoteUser.language.flag}
                 </div>
             </div>
         )}
         
         {messages.map((msg) => {
             const isMe = msg.senderId === currentUser.id;
             const senderLang = isMe ? currentUser.language : remoteUser.language;
             
             return (
                 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] md:max-w-[70%] group`}>
                         <div className={`p-4 rounded-2xl shadow-lg ${
                             isMe 
                             ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-br-none' 
                             : 'bg-surface border border-gray-700 text-gray-100 rounded-bl-none'
                         }`}>
                             {/* Show Translated Text prominently */}
                             <p className="text-lg mb-1 leading-relaxed">{msg.translatedText}</p>
                             
                             {/* Metadata */}
                             <div className={`text-xs border-t ${isMe ? 'border-white/20 text-blue-100' : 'border-gray-600 text-gray-400'} pt-2 mt-2 flex flex-col gap-1`}>
                                 <span className="uppercase tracking-wider font-bold text-[10px]">Original ({senderLang.name})</span>
                                 <span className="italic opacity-80">{msg.originalText}</span>
                             </div>
                         </div>
                         <div className={`text-[10px] text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                             {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
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
             <div className="flex-1 bg-dark/50 border border-gray-600 rounded-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all flex items-center">
                 <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Type in ${activeSimulator === 'ME' ? currentUser.language.name : remoteUser.language.name}...`}
                    className="flex-1 bg-transparent p-4 text-white placeholder-gray-500 focus:outline-none"
                 />
             </div>
             <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white shadow-lg transition-transform active:scale-95"
             >
                <Send size={24} />
             </button>
         </div>
      </div>
    </div>
  );
};

export default ChatInterface;
