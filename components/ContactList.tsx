import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { Phone, MessageSquare, Search, User } from 'lucide-react';

interface ContactListProps {
  currentUser: UserProfile;
  onSelectContact: (contact: UserProfile, mode: 'CHAT' | 'CALL') => void;
}

const ContactList: React.FC<ContactListProps> = ({ currentUser, onSelectContact }) => {
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate fetching contacts from backend
    const allUsers = userService.getAllContacts(currentUser.id);
    setContacts(allUsers);
  }, [currentUser.id]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phoneNumber.includes(searchTerm) ||
    c.language.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-dark text-white flex flex-col pb-20">
      
      {/* Header Area */}
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-bold mb-4">Chats</h1>
        <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search by name or language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredContacts.length === 0 ? (
           <div className="text-center text-gray-500 mt-10">
               <User size={48} className="mx-auto mb-2 opacity-20" />
               <p>No matching users found.</p>
           </div>
        ) : (
            <div className="space-y-3">
            {filteredContacts.map(contact => (
                <div key={contact.id} className="bg-surface hover:bg-surface/80 border border-gray-700/50 p-4 rounded-xl transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                        <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full bg-gray-800 object-cover" />
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-surface rounded-full ${contact.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></span>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate">{contact.name}</h3>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            {contact.status ? (
                                <span className="truncate max-w-[150px]">{contact.status}</span>
                            ) : (
                                <span>Speaks {contact.language.flag} {contact.language.name}</span>
                            )}
                            <span className="text-gray-600">•</span>
                            <span className={contact.isOnline ? 'text-green-400' : 'text-gray-500'}>
                                {contact.isOnline ? 'Online' : 'Offline'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                        onClick={() => onSelectContact(contact, 'CHAT')}
                        className="p-3 bg-gray-700/50 hover:bg-primary/20 hover:text-primary rounded-full transition-colors"
                        title="Chat"
                    >
                        <MessageSquare size={18} />
                    </button>
                    <button 
                        onClick={() => onSelectContact(contact, 'CALL')}
                        className="p-3 bg-gray-700/50 hover:bg-secondary/20 hover:text-secondary rounded-full transition-colors"
                        title="Video Call"
                    >
                        <Phone size={18} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;