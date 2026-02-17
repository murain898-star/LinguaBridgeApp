import React from 'react';
import { UserConfig, SUPPORTED_LANGUAGES, Language } from '../types';
import { Settings, User, Globe } from 'lucide-react';

interface LanguageSetupProps {
  onComplete: (userA: UserConfig, userB: UserConfig) => void;
}

const LanguageSetup: React.FC<LanguageSetupProps> = ({ onComplete }) => {
  const [userA, setUserA] = React.useState<UserConfig>({
    name: 'You (User A)',
    language: SUPPORTED_LANGUAGES[1], // Default Hindi
  });
  const [userB, setUserB] = React.useState<UserConfig>({
    name: 'Partner (User B)',
    language: SUPPORTED_LANGUAGES[0], // Default English
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(userA, userB);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="glass-panel w-full max-w-2xl p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-secondary/20 rounded-full blur-3xl translate-x-10 translate-y-10"></div>

        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              LinguaBridge
            </h1>
            <p className="text-gray-400">Universal Translation Calling App</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* User A Config */}
              <div className="bg-surface/50 p-6 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4 text-primary">
                  <User size={20} />
                  <h3 className="font-semibold text-lg">Your Profile</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={userA.name}
                      onChange={(e) => setUserA({ ...userA, name: e.target.value })}
                      className="w-full bg-dark/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Your Language</label>
                    <div className="relative">
                      <select
                        value={userA.language.code}
                        onChange={(e) => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                          if (lang) setUserA({ ...userA, language: lang });
                        }}
                        className="w-full bg-dark/50 border border-gray-600 rounded-lg p-3 pr-10 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
                      >
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                      <Globe className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* User B Config */}
              <div className="bg-surface/50 p-6 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4 text-secondary">
                  <User size={20} />
                  <h3 className="font-semibold text-lg">Partner Profile</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={userB.name}
                      onChange={(e) => setUserB({ ...userB, name: e.target.value })}
                      className="w-full bg-dark/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Partner's Language</label>
                    <div className="relative">
                      <select
                        value={userB.language.code}
                        onChange={(e) => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                          if (lang) setUserB({ ...userB, language: lang });
                        }}
                        className="w-full bg-dark/50 border border-gray-600 rounded-lg p-3 pr-10 text-white appearance-none focus:outline-none focus:border-secondary transition-colors"
                      >
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                      <Globe className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Start Communication
              <Settings size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LanguageSetup;
