import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit, Palette, LogOut } from 'lucide-react';
import { UseSettingsReturn, themes, ThemeName } from '../hooks/useSettings';

interface SettingsViewProps {
  settingsHook: UseSettingsReturn;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settingsHook }) => {
  const { settings, setTheme, setUserName, signOut, authUser } = settingsHook;
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName);

  const handleNameSave = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setEditingName(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Account Section */}
      <section>
        <h3 className="text-xl font-title font-bold text-neutral mb-4">Account</h3>
        <div className="bg-base-100 p-4 rounded-xl shadow-sm space-y-4">
           <div className="flex justify-between items-center">
             <label className="text-neutral-content">Email</label>
             <span className="font-semibold text-neutral-content text-sm">{authUser?.email}</span>
           </div>
          <div className="flex justify-between items-center">
            <label className="text-neutral-content">Name</label>
            {editingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-2 py-1 bg-base-200 border border-base-300 rounded-md focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                />
                <button onClick={handleNameSave} className="text-success hover:text-primary-focus p-1">
                  <Check size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-neutral">{settings.userName}</span>
                <button onClick={() => setEditingName(true)} className="text-neutral-content hover:text-primary p-1">
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>
           <button 
                onClick={signOut} 
                className="w-full flex items-center justify-center space-x-2 text-error font-semibold hover:bg-error/10 p-3 rounded-lg transition-colors border border-transparent hover:border-error/20"
            >
                <LogOut size={18} />
                <span>Sign Out</span>
            </button>
        </div>
      </section>

      {/* Appearance Section */}
      <section>
        <h3 className="text-xl font-title font-bold text-neutral mb-4">Appearance</h3>
        <div className="bg-base-100 p-4 rounded-xl shadow-sm space-y-6">
          {/* Theme Chooser */}
          <div>
             <div className="flex items-center space-x-2 mb-3">
               <Palette className="text-primary" />
               <h4 className="font-semibold text-neutral">Theme</h4>
             </div>
             <div className="grid grid-cols-3 gap-4">
                {Object.keys(themes).map((themeKey) => {
                    const themeName = themeKey as ThemeName;
                    const theme = themes[themeName];
                    const isActive = settings.theme === themeName;
                    return (
                        <button
                            key={themeName}
                            onClick={() => setTheme(themeName)}
                            className={`p-2 rounded-lg border-2 ${isActive ? 'border-primary' : 'border-transparent'}`}
                        >
                            <div className="flex space-x-1">
                                <div className="w-1/3 h-8 rounded" style={{ backgroundColor: theme.primary }}></div>
                                <div className="w-1/3 h-8 rounded" style={{ backgroundColor: theme.secondary }}></div>
                                <div className="w-1/3 h-8 rounded" style={{ backgroundColor: theme['base-200'] }}></div>
                            </div>
                            <p className={`capitalize mt-2 text-sm font-semibold ${isActive ? 'text-primary' : 'text-neutral-content'}`}>{themeName}</p>
                        </button>
                    )
                })}
             </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default SettingsView;