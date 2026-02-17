import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import VideoCall from './components/VideoCall';
import ChatInterface from './components/ChatInterface';
import { UserProfile, AppMode } from './types';
import { userService } from './services/userService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.AUTH);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [isVideo, setIsVideo] = useState(true);

  // Check for existing session
  useEffect(() => {
    const savedUser = userService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setMode(AppMode.DASHBOARD);
    }
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setMode(AppMode.DASHBOARD);
  };

  const handleLogout = () => {
    userService.logout();
    setCurrentUser(null);
    setMode(AppMode.AUTH);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  const handleSelectContact = (contact: UserProfile, contactMode: 'CHAT' | 'CALL') => {
    setSelectedContact(contact);
    if (contactMode === 'CALL') {
      setIsVideo(true);
      setMode(AppMode.CALL);
    } else {
      setMode(AppMode.CHAT);
    }
  };

  const handleStartCallFromChat = (withVideo: boolean) => {
    setIsVideo(withVideo);
    setMode(AppMode.CALL);
  };

  const handleEndCall = () => {
    setMode(AppMode.CHAT);
  };

  const handleBackToDashboard = () => {
    setSelectedContact(null);
    setMode(AppMode.DASHBOARD);
  };

  // Render Logic

  if (mode === AppMode.AUTH) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (mode === AppMode.DASHBOARD && currentUser) {
    return (
      <Dashboard
        currentUser={currentUser}
        onSelectContact={handleSelectContact}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />
    );
  }

  if (!currentUser || !selectedContact) return null;

  if (mode === AppMode.CALL) {
    return (
      <VideoCall
        currentUser={currentUser}
        remoteUser={selectedContact}
        onEndCall={handleEndCall}
        isVideoEnabled={isVideo}
      />
    );
  }

  if (mode === AppMode.CHAT) {
    return (
      <ChatInterface
        currentUser={currentUser}
        remoteUser={selectedContact}
        onBack={handleBackToDashboard}
        onStartCall={handleStartCallFromChat}
      />
    );
  }

  return null;
};

export default App;
