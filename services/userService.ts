import { UserProfile, SUPPORTED_LANGUAGES, Short } from '../types';
import { cryptoService } from './cryptoService';

const STORAGE_KEY = 'linguabridge_users';
const CURRENT_USER_KEY = 'linguabridge_current_user';
const KEYS_PREFIX = 'linguabridge_priv_key_';

// Mock data to ensure there are people to talk to
const MOCK_USERS: UserProfile[] = [
  {
    id: 'user_1',
    phoneNumber: '9876543210',
    name: 'Rahul Sharma',
    language: SUPPORTED_LANGUAGES.find(l => l.code === 'hi')!,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    status: 'Available for calls 📞',
    isOnline: true
  },
  {
    id: 'user_2',
    phoneNumber: '1234567890',
    name: 'Sarah Jenkins',
    language: SUPPORTED_LANGUAGES.find(l => l.code === 'en')!,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    status: 'Busy translating the world 🌎',
    isOnline: false
  },
  {
    id: 'user_3',
    phoneNumber: '5555555555',
    name: 'Yuki Tanaka',
    language: SUPPORTED_LANGUAGES.find(l => l.code === 'ja')!,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
    status: 'Learning Spanish 🇪🇸',
    isOnline: true
  }
];

const MOCK_SHORTS: Short[] = [
  {
    id: 'short_1',
    userId: 'user_2',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    mediaUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    type: 'image',
    caption: 'Beautiful sunset in Paris today! 🇫🇷',
    timestamp: Date.now() - 3600000,
    likes: 24
  },
  {
    id: 'short_2',
    userId: 'user_1',
    userName: 'Rahul Sharma',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    type: 'video',
    caption: 'Night city vibes 🌃',
    timestamp: Date.now() - 7200000,
    likes: 156
  }
];

export const userService = {
  // Initialize mock DB and Keys
  init: async () => {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Merge mock users if storage is empty
    if (users.length === 0) {
      users = [...MOCK_USERS];
    }

    // Ensure all users have keys (Simulating separate devices generating keys)
    let updated = false;
    for (const user of users) {
      if (!user.publicKey) {
        // Generate keys for this user
        const keyPair = await cryptoService.generateKeyPair();
        user.publicKey = await cryptoService.exportKey(keyPair.publicKey, 'public');
        
        // Save private key to local storage (Simulating secure storage on user's device)
        const privKeyStr = await cryptoService.exportKey(keyPair.privateKey, 'private');
        localStorage.setItem(KEYS_PREFIX + user.id, privKeyStr);
        updated = true;
      }
    }

    if (updated || users.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  },

  loginOrRegister: async (phoneNumber: string, name?: string, languageCode?: string): Promise<UserProfile> => {
    // Ensure init is done
    await userService.init();
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let user = users.find((u: UserProfile) => u.phoneNumber === phoneNumber);

    if (user) {
      // Login
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    } else {
      // Register
      if (!name || !languageCode) throw new Error("Name and Language required for new registration");
      
      // Generate Keys for new user
      const keyPair = await cryptoService.generateKeyPair();
      const publicKeyStr = await cryptoService.exportKey(keyPair.publicKey, 'public');
      const privateKeyStr = await cryptoService.exportKey(keyPair.privateKey, 'private');

      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        phoneNumber,
        name,
        language: SUPPORTED_LANGUAGES.find(l => l.code === languageCode) || SUPPORTED_LANGUAGES[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        status: 'Hey there! I am using LinguaBridge.',
        publicKey: publicKeyStr,
        isOnline: true
      };

      // Store Private Key
      localStorage.setItem(KEYS_PREFIX + newUser.id, privateKeyStr);

      users.push(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      return newUser;
    }
  },

  getPrivateKey: (userId: string): string | null => {
    return localStorage.getItem(KEYS_PREFIX + userId);
  },

  updateProfile: (updatedUser: UserProfile): void => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = users.findIndex((u: UserProfile) => u.id === updatedUser.id);
    
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  },

  checkUserExists: (phoneNumber: string): boolean => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return !!users.find((u: UserProfile) => u.phoneNumber === phoneNumber);
  },

  getCurrentUser: (): UserProfile | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getAllContacts: (excludeUserId: string): UserProfile[] => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return users.filter((u: UserProfile) => u.id !== excludeUserId);
  },

  getShorts: (): Short[] => {
    return MOCK_SHORTS;
  },

  sendOtp: (phoneNumber: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const otp = '1234';
        console.log(`Sending OTP ${otp} to ${phoneNumber}`);
        resolve(otp);
      }, 1000);
    });
  },

  verifyOtp: (phoneNumber: string, otp: string): Promise<boolean> => {
     return new Promise((resolve) => {
        setTimeout(() => {
           resolve(otp === '1234');
        }, 800);
     });
  }
};