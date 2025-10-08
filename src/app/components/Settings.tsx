'use client';

import { useState, useEffect } from 'react';
import { GlobeAltIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from '../contexts/WebSocketContext';

interface SystemSettings {
  language: string;
  notifications: {
    emailAlerts: boolean;
    systemAlerts: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
  };
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export default function Settings() {
  const { socket } = useWebSocket();
  const [settings, setSettings] = useState<SystemSettings>({
    language: 'en',
    notifications: {
      emailAlerts: true,
      systemAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('settings-update', (updatedSettings: SystemSettings) => {
      setSettings(updatedSettings);
    });

    socket.emit('get-settings');

    return () => {
      socket.off('settings-update');
    };
  }, [socket]);

  const updateSettings = (newSettings: SystemSettings) => {
    if (!socket) return;
    socket.emit('update-settings', newSettings);
    setSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div className="backdrop-blur-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <GlobeAltIcon className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Language & Localization</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Interface Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ ...settings, language: e.target.value })}
              className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="backdrop-blur-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <BellIcon className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Alerts</h4>
              <p className="text-sm text-gray-400">Receive important updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications.emailAlerts}
                onChange={(e) => updateSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    emailAlerts: e.target.checked,
                  },
                })}
              />
              <div className="w-11 h-6 bg-blue-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-blue-400 after:border-blue-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500/40"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">System Alerts</h4>
              <p className="text-sm text-gray-400">Get notified about system events</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => updateSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    systemAlerts: e.target.checked,
                  },
                })}
              />
              <div className="w-11 h-6 bg-blue-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-blue-400 after:border-blue-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500/40"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="backdrop-blur-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Security</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-400">Add an extra layer of security</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => updateSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    twoFactorAuth: e.target.checked,
                  },
                })}
              />
              <div className="w-11 h-6 bg-blue-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-blue-400 after:border-blue-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500/40"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.security.sessionTimeout}
              onChange={(e) => updateSettings({
                ...settings,
                security: {
                  ...settings.security,
                  sessionTimeout: parseInt(e.target.value),
                },
              })}
              className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}