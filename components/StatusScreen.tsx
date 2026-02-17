import React, { useState, useEffect } from 'react';
import { Short, UserProfile } from '../types';
import { Plus, Heart, Play } from 'lucide-react';
import { userService } from '../services/userService';

interface StatusScreenProps {
  currentUser: UserProfile;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ currentUser }) => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    setShorts(userService.getShorts());
  }, []);

  const handlePostStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim()) return;

    // In a real app, this would update the user's status globally
    userService.updateProfile({ ...currentUser, status: statusText });
    alert('Status updated!');
    setStatusText('');
  };

  return (
    <div className="h-full bg-dark text-white overflow-y-auto pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Status & Shorts</h1>

        {/* My Status Section */}
        <div className="bg-surface border border-gray-700 rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-3 mb-4">
                 <div className="relative">
                    <img src={currentUser.avatar} alt="Me" className="w-12 h-12 rounded-full border-2 border-primary" />
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-0.5 border border-dark">
                        <Plus size={12} className="text-white" />
                    </div>
                 </div>
                 <div className="flex-1">
                     <h3 className="font-semibold">My Status</h3>
                     <p className="text-sm text-gray-400">{currentUser.status || 'Tap to add status'}</p>
                 </div>
            </div>
            <form onSubmit={handlePostStatus} className="flex gap-2">
                <input 
                   type="text" 
                   value={statusText}
                   onChange={(e) => setStatusText(e.target.value)}
                   placeholder="What's on your mind?"
                   className="flex-1 bg-dark/50 border border-gray-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <button type="submit" className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    Post
                </button>
            </form>
        </div>

        {/* Shorts Feed */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Play size={20} className="text-secondary fill-secondary" />
            Trending Shorts
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shorts.map(short => (
                <div key={short.id} className="relative aspect-[9/16] bg-gray-800 rounded-2xl overflow-hidden group">
                    {short.type === 'video' ? (
                        <video 
                           src={short.mediaUrl} 
                           className="w-full h-full object-cover"
                           loop
                           muted
                           playsInline
                           autoPlay // In a real app, manage autoplay with intersection observer
                        />
                    ) : (
                        <img src={short.mediaUrl} alt="Short" className="w-full h-full object-cover" />
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    {/* Content Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-2">
                             <img src={short.userAvatar} alt={short.userName} className="w-8 h-8 rounded-full border border-white" />
                             <span className="font-semibold text-sm">{short.userName}</span>
                        </div>
                        <p className="text-sm text-gray-200 mb-2 line-clamp-2">{short.caption}</p>
                        <div className="flex items-center gap-1 text-red-500">
                             <Heart size={16} fill="currentColor" />
                             <span className="text-xs font-bold text-white">{short.likes}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StatusScreen;
