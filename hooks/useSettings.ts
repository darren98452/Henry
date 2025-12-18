import { useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

export const themes = {
  lavender: {
    primary: '#a78bfa',
    'primary-focus': '#8b5cf6',
    secondary: '#2dd4bf',
    accent: '#f472b6',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#f6f4fc',
    'base-200': '#ede9fe',
  },
  rose: {
    primary: '#f472b6',
    'primary-focus': '#ec4899',
    secondary: '#60a5fa',
    accent: '#f59e0b',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#fdf2f8',
    'base-200': '#fce7f3',
  },
  teal: {
    primary: '#2dd4bf',
    'primary-focus': '#14b8a6',
    secondary: '#f59e0b',
    accent: '#f472b6',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#f0fdfa',
    'base-200': '#ccfbf1',
  },
  forest: {
    primary: '#22c55e',
    'primary-focus': '#16a34a',
    secondary: '#f59e0b',
    accent: '#3b82f6',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#f0fdf4',
    'base-200': '#dcfce7',
  },
  ocean: {
    primary: '#3b82f6',
    'primary-focus': '#2563eb',
    secondary: '#14b8a6',
    accent: '#f472b6',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#eff6ff',
    'base-200': '#dbeafe',
  },
  sunset: {
    primary: '#f97316',
    'primary-focus': '#ea580c',
    secondary: '#ec4899',
    accent: '#60a5fa',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#fff7ed',
    'base-200': '#ffedd5',
  },
  graphite: {
    primary: '#64748b',
    'primary-focus': '#475569',
    secondary: '#ef4444',
    accent: '#2dd4bf',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#f8fafc',
    'base-200': '#f1f5f9',
  },
  ruby: {
    primary: '#ef4444',
    'primary-focus': '#dc2626',
    secondary: '#f59e0b',
    accent: '#2dd4bf',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#fef2f2',
    'base-200': '#fee2e2',
  },
  mint: {
    primary: '#10b981',
    'primary-focus': '#059669',
    secondary: '#a855f7',
    accent: '#f472b6',
    neutral: '#111827',
    'neutral-content': '#4b5563',
    'base-100': '#ecfdf5',
    'base-200': '#d1fae5',
  },
  midnight: {
    primary: '#22d3ee',
    'primary-focus': '#67e8f9',
    secondary: '#f472b6',
    accent: '#fde047',
    neutral: '#e5e7eb',
    'neutral-content': '#9ca3af',
    'base-100': '#1e293b',
    'base-200': '#0f172a',
  },
  slate: {
    primary: '#818cf8',
    'primary-focus': '#a5b4fc',
    secondary: '#f59e0b',
    accent: '#34d399',
    neutral: '#f3f4f6',
    'neutral-content': '#d1d5db',
    'base-100': '#374151',
    'base-200': '#1f2937',
  },
  matrix: {
    primary: '#4ade80',
    'primary-focus': '#86efac',
    secondary: '#a3a3a3',
    accent: '#ffffff',
    neutral: '#f0fdf4',
    'neutral-content': '#a3a3a3',
    'base-100': '#171717',
    'base-200': '#0a0a0a',
  },
  vampire: {
    primary: '#f87171',
    'primary-focus': '#fca5a5',
    secondary: '#9ca3af',
    accent: '#a78bfa',
    neutral: '#fef2f2',
    'neutral-content': '#9ca3af',
    'base-100': '#171717',
    'base-200': '#111827',
  },
  cyberpunk: {
    primary: '#f472b6',
    'primary-focus': '#f9a8d4',
    secondary: '#fde047',
    accent: '#06b6d4',
    neutral: '#f5d0fe',
    'neutral-content': '#a5b4fc',
    'base-100': '#2e1065',
    'base-200': '#1e1b4b',
  },
  dracula: {
    primary: '#bd93f9',
    'primary-focus': '#d6acff',
    secondary: '#ff79c6',
    accent: '#8be9fd',
    neutral: '#f8f8f2',
    'neutral-content': '#6272a4',
    'base-100': '#44475a',
    'base-200': '#282a36',
  },
  nord: {
    primary: '#88c0d0',
    'primary-focus': '#a0d1e0',
    secondary: '#ebcb8b',
    accent: '#bf616a',
    neutral: '#eceff4',
    'neutral-content': '#d8dee9',
    'base-100': '#3b4252',
    'base-200': '#2e3440',
  },
  obsidian: {
    primary: '#a855f7',
    'primary-focus': '#c084fc',
    secondary: '#64748b',
    accent: '#3b82f6',
    neutral: '#e2e8f0',
    'neutral-content': '#94a3b8',
    'base-100': '#1e293b',
    'base-200': '#020617',
  },
  evergreen: {
    primary: '#34d399',
    'primary-focus': '#6ee7b7',
    secondary: '#f59e0b',
    accent: '#fbbf24',
    neutral: '#ecfdf5',
    'neutral-content': '#a7f3d0',
    'base-100': '#064e3b',
    'base-200': '#062d21',
  },
};

export type ThemeName = keyof typeof themes;

export interface Settings {
  theme: ThemeName;
  userName: string;
}

const defaultSettings: Settings & { hasAcceptedDisclaimer: boolean } = {
  theme: 'lavender',
  userName: 'Learner',
  hasAcceptedDisclaimer: false,
};

export const useSettings = () => {
    const { authUser, userData, setTheme, setUserName, signOut } = useContext(UserContext);
    const settings = userData?.settings || defaultSettings;

    useEffect(() => {
        const theme = themes[settings.theme] || themes.lavender;
        for (const [key, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(`--color-${key}`, String(value));
        }
    }, [settings.theme]);

    return {
        authUser,
        settings,
        setTheme,
        setUserName,
        signOut,
    };
};

export type UseSettingsReturn = ReturnType<typeof useSettings>;