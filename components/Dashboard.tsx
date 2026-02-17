import React, { useState } from 'react';
import { UserProfile } from '../types';
import ContactList from './ContactList';
import StatusScreen from './StatusScreen';
import ProfileScreen from './ProfileScreen';
import { MessageSquare, CircleDashed, User } from 'lucide-react';

interface DashboardProps {
  currentUser: UserProfile;
  onSelectContact: (contact: UserProfile, mode: 'CHAT' | 'CALL') => void;
  onUpdateUser: (user: UserProfile) => void;
  onLogout: () => void;
}

type Tab = 'CHATS' | 'STATUS' | 'PROFILE';

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onSelectContact, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CHATS');

  return (
    <div className="h-screen bg-dark flex flex-col relative">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'CHATS' && (
          <ContactList currentUser={currentUser} onSelectContact={onSelectContact} />
        )}
        {activeTab === 'STATUS' && (
          <StatusScreen currentUser={currentUser} />
        )}
        {activeTab === 'PROFILE' && (
          <ProfileScreen user={currentUser} onUpdateUser={onUpdateUser} onLogout={onLogout} />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-t border-gray-700 flex items-center justify-around z-50">
        <button 
          onClick={() => setActiveTab('CHATS')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'CHATS' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <MessageSquare size={24} strokeWidth={activeTab === 'CHATS' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Chats</span>
        </button>

        <button 
          onClick={() => setActiveTab('STATUS')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'STATUS' ? 'text-secondary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <CircleDashed size={24} strokeWidth={activeTab === 'STATUS' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Status</span>
        </button>

        <button 
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'PROFILE' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className={`p-0.5 rounded-full border-2 ${activeTab === 'PROFILE' ? 'border-primary' : 'border-transparent'}`}>
             <img src={currentUser.avatar} alt="Me" className="w-5 h-5 rounded-full" />
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
