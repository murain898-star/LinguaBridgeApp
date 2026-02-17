import React, { useState } from 'react';
import { UserProfile, SUPPORTED_LANGUAGES } from '../types';
import { User, Globe, Save, ChevronRight, FileText, Shield, HelpCircle, LogOut, Edit2 } from 'lucide-react';
import { userService } from '../services/userService';
import LegalDocs from './LegalDocs';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.status || '');
  const [langCode, setLangCode] = useState(user.language.code);
  const [legalModal, setLegalModal] = useState<'T&C' | 'POLICY' | 'FAQ' | null>(null);

  const handleSave = () => {
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || user.language;
    
    const updatedUser: UserProfile = {
      ...user,
      name,
      status,
      language: selectedLang,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` // Update avatar seed if name changes
    };
    
    userService.updateProfile(updatedUser);
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  return (
    <div className="h-full bg-dark text-white overflow-y-auto pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings & Profile</h1>

        {/* Profile Card */}
        <div className="bg-surface border border-gray-700 rounded-2xl p-6 mb-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
           
           <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-surface bg-gray-800 shadow-xl mb-4 overflow-hidden relative group">
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <User size={24} className="text-white" />
                    </div>
                  )}
              </div>
              
              {!isEditing ? (
                 <>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-400 text-sm mb-2">+{user.phoneNumber}</p>
                    <p className="text-primary text-sm font-medium bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                       {user.status || 'No status set'}
                    </p>
                    <button 
                       onClick={() => setIsEditing(true)}
                       className="absolute top-2 right-0 p-2 text-gray-400 hover:text-white bg-dark/50 rounded-full backdrop-blur-sm"
                    >
                       <Edit2 size={16} />
                    </button>
                 </>
              ) : (
                 <div className="w-full space-y-4 mt-2">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Display Name</label>
                        <input 
                           type="text" 
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           className="w-full bg-dark border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Status</label>
                        <input 
                           type="text" 
                           value={status}
                           onChange={(e) => setStatus(e.target.value)}
                           className="w-full bg-dark border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
           {isEditing && (
               <div className="bg-surface border border-gray-700 rounded-2xl p-6">
                   <h3 className="font-semibold mb-4 flex items-center gap-2">
                       <Globe size={18} className="text-secondary" />
                       Language Preference
                   </h3>
                   <select
                        value={langCode}
                        onChange={(e) => setLangCode(e.target.value)}
                        className="w-full bg-dark border border-gray-600 rounded-lg p-3 text-white appearance-none focus:outline-none focus:border-secondary transition-colors"
                      >
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
               </div>
           )}

           {isEditing ? (
               <div className="flex gap-3">
                   <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 rounded-xl border border-gray-600 hover:bg-gray-800 transition-colors"
                   >
                       Cancel
                   </button>
                   <button 
                      onClick={handleSave}
                      className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                   >
                       <Save size={18} />
                       Save Changes
                   </button>
               </div>
           ) : (
               <div className="bg-surface border border-gray-700 rounded-2xl overflow-hidden">
                   <button onClick={() => setLegalModal('T&C')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-gray-700/50">
                       <div className="flex items-center gap-3">
                           <FileText size={20} className="text-gray-400" />
                           <span>Terms & Conditions</span>
                       </div>
                       <ChevronRight size={16} className="text-gray-500" />
                   </button>
                   <button onClick={() => setLegalModal('POLICY')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-gray-700/50">
                       <div className="flex items-center gap-3">
                           <Shield size={20} className="text-gray-400" />
                           <span>Privacy Policy</span>
                       </div>
                       <ChevronRight size={16} className="text-gray-500" />
                   </button>
                   <button onClick={() => setLegalModal('FAQ')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-gray-700/50">
                       <div className="flex items-center gap-3">
                           <HelpCircle size={20} className="text-gray-400" />
                           <span>FAQ & Help</span>
                       </div>
                       <ChevronRight size={16} className="text-gray-500" />
                   </button>
                   <button onClick={onLogout} className="w-full p-4 flex items-center justify-between hover:bg-red-500/10 transition-colors text-red-400">
                       <div className="flex items-center gap-3">
                           <LogOut size={20} />
                           <span>Logout</span>
                       </div>
                   </button>
               </div>
           )}
        </div>
      </div>

      <LegalDocs type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
};

export default ProfileScreen;
