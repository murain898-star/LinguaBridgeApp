import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, UserProfile } from '../types';
import { Phone, User, Globe, ArrowRight, Smartphone, KeyRound, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'DETAILS'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0].code);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phoneNumber.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await userService.sendOtp(phoneNumber);
      // For demo purposes, we alert the OTP
      alert('Your OTP is 1234'); 
      setStep('OTP');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await userService.verifyOtp(phoneNumber, otp);
      if (isValid) {
        const exists = userService.checkUserExists(phoneNumber);
        if (exists) {
           const user = await userService.loginOrRegister(phoneNumber);
           onLogin(user);
        } else {
           setStep('DETAILS');
        }
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await userService.loginOrRegister(phoneNumber, name, selectedLang);
      onLogin(user);
    } catch (err) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-gray-700">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            {step === 'OTP' ? <KeyRound size={32} /> : <Smartphone size={32} />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-gray-400">
            {step === 'PHONE' && 'Enter your mobile number to start'}
            {step === 'OTP' && `Enter OTP sent to +${phoneNumber}`}
            {step === 'DETAILS' && 'Complete your profile'}
          </p>
        </div>

        {step === 'PHONE' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-dark/50 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors font-mono text-lg"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Get OTP <ArrowRight size={20} /></>}
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">One Time Password</label>
              <div className="flex justify-center">
                 <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="----"
                  className="w-40 bg-dark/50 border border-gray-600 rounded-xl py-3 text-center text-white focus:outline-none focus:border-primary transition-colors font-mono text-3xl tracking-widest"
                  autoFocus
                />
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">Use default OTP: 1234</p>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="space-y-3">
                <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
                </button>
                
                <button
                    type="button"
                    onClick={() => { setStep('PHONE'); setError(''); setOtp(''); }}
                    className="w-full text-gray-400 text-sm hover:text-white transition-colors"
                >
                    Change Number
                </button>
            </div>
          </form>
        )}

        {step === 'DETAILS' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-dark/50 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Preferred Language</label>
              <div className="relative">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full bg-dark/50 border border-gray-600 rounded-xl py-3 pl-4 pr-10 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={18} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We will translate all incoming calls and messages to this language.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
