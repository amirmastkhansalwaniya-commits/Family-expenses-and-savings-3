import React from 'react';
import { AppBrandingSettings } from '../utils/appBranding';
import { Wallet, Landmark, ShieldCheck, Gem, Home, Crown, TrendingUp, Coins } from 'lucide-react';

interface AppLogoProps {
  className?: string;
  size?: number;
  showBadgeBackground?: boolean;
  brandingSettings?: AppBrandingSettings;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 52,
  showBadgeBackground = false,
  brandingSettings,
}) => {
  const logoType = brandingSettings?.logoType || 'default';

  const renderIconContent = () => {
    if (logoType === 'emoji' && brandingSettings?.emojiIcon) {
      return (
        <span className="flex items-center justify-center select-none" style={{ fontSize: size * 0.65 }}>
          {brandingSettings.emojiIcon}
        </span>
      );
    }

    if (logoType === 'image' && brandingSettings?.imageUrl) {
      return (
        <img
          src={brandingSettings.imageUrl}
          alt="App Logo"
          className="w-full h-full object-cover rounded-xl shadow-md"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
          referrerPolicy="no-referrer"
        />
      );
    }

    if (logoType === 'preset') {
      const iconSize = Math.round(size * 0.55);
      switch (brandingSettings?.presetIcon) {
        case 'wallet':
          return <Wallet className="text-amber-500" style={{ width: iconSize, height: iconSize }} />;
        case 'piggy':
          return <Landmark className="text-emerald-500" style={{ width: iconSize, height: iconSize }} />;
        case 'shield':
          return <ShieldCheck className="text-indigo-500" style={{ width: iconSize, height: iconSize }} />;
        case 'gem':
          return <Gem className="text-purple-500" style={{ width: iconSize, height: iconSize }} />;
        case 'home':
          return <Home className="text-rose-500" style={{ width: iconSize, height: iconSize }} />;
        case 'crown':
          return <Crown className="text-amber-400" style={{ width: iconSize, height: iconSize }} />;
        case 'chart':
          return <TrendingUp className="text-cyan-500" style={{ width: iconSize, height: iconSize }} />;
        case 'coins':
          return <Coins className="text-amber-500" style={{ width: iconSize, height: iconSize }} />;
        default:
          return <Wallet className="text-amber-500" style={{ width: iconSize, height: iconSize }} />;
      }
    }

    // Default SVG
    return (
      <img
        src="/app-logo.svg"
        alt="Family Expenses & Wealth App Icon"
        className="w-full h-full object-contain drop-shadow-xl"
        referrerPolicy="no-referrer"
      />
    );
  };

  const isPresetOrEmoji = logoType === 'preset' || logoType === 'emoji';

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
        showBadgeBackground || isPresetOrEmoji
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/70 p-1.5 rounded-2xl shadow-xl'
          : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title="App Branding Logo"
    >
      {renderIconContent()}
    </div>
  );
};


