import React, { useState } from 'react';
import {
  Settings,
  X,
  Sun,
  Moon,
  Palette,
  Type,
  Smartphone,
  Globe,
  Users,
  Key,
  Download,
  FileText,
  Share2,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Smile,
  Image as ImageIcon,
  Upload,
  Trash2,
  FolderOpen,
  Wallet,
  Landmark,
  Gem,
  Home,
  Crown,
  TrendingUp,
  Coins,
  Calendar,
} from 'lucide-react';
import { FamilyMember, MemberCustomConfig } from '../types';
import { Language, LANGUAGE_OPTIONS, t } from '../utils/translations';
import { MemberAvatar } from './MemberAvatar';
import {
  AppBrandingSettings,
  BrandingFont,
  BrandingColor,
  LogoType,
  PresetLogoIcon,
  getBrandingColorClasses,
  getBrandingFontFamily,
} from '../utils/appBranding';
import { AppLogo } from './AppLogo';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  appVariation: string;
  onOpenThemeVariations?: () => void;
  onOpenTypography?: () => void;
  isRatio916?: boolean;
  onToggleRatio916?: () => void;
  activeMember: FamilyMember;
  familyMembers: string[];
  memberConfigs: Record<string, MemberCustomConfig>;
  onSelectMember: (member: FamilyMember) => void;
  onOpenManageMembers?: () => void;
  adminPin: string;
  onOpenChangePinModal?: () => void;
  onOpenExportImport?: () => void;
  onOpenPdfSummary?: () => void;
  onRunWeeklyBackup?: () => void;
  onOpenWebLinkModal?: () => void;
  brandingSettings: AppBrandingSettings;
  onUpdateBrandingSettings: (updated: AppBrandingSettings) => void;
}

const PRESET_ICONS: { id: PresetLogoIcon; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'piggy', label: 'Piggy Bank', icon: Landmark },
  { id: 'shield', label: 'Shield', icon: ShieldCheck },
  { id: 'gem', label: 'Gem', icon: Gem },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'crown', label: 'Crown', icon: Crown },
  { id: 'chart', label: 'Growth Chart', icon: TrendingUp },
  { id: 'coins', label: 'Gold Coins', icon: Coins },
];

const EMOJI_PRESETS = ['💰', '🏦', '💳', '💎', '📈', '🏠', '👑', '✨', '📊', '💵', '🦁', '🌟', '🚀', '🔥', '🛡️'];

const GALLERY_PRESETS = [
  {
    id: 'piggy',
    title: 'Gold Savings',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'gold_vault',
    title: 'Gold Coins',
    url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'finance_shield',
    title: 'Finance Shield',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'growth_chart',
    title: 'Growth Chart',
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'family_home',
    title: 'Family Home',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'diamond_crest',
    title: 'Diamond Crest',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&auto=format&fit=crop&q=80',
  },
];

const BRANDING_FONTS: { id: BrandingFont; label: string; familyName: string; sampleText: string }[] = [
  { id: 'default', label: 'Theme Default', familyName: 'Inherit', sampleText: 'Family Expense Tracker' },
  { id: 'garamond', label: 'Garamond (Executive Serif)', familyName: "'Cormorant Garamond', serif", sampleText: 'Executive Editorial Title' },
  { id: 'inter', label: 'Inter (Clean Modern Sans)', familyName: "'Inter', sans-serif", sampleText: 'Clean Tech Sans Interface' },
  { id: 'syne', label: 'Syne (Geometric Display)', familyName: "'Syne', sans-serif", sampleText: 'Geometric Bold Brand' },
  { id: 'mono', label: 'Monospace (Code / Tech)', familyName: "'JetBrains Mono', monospace", sampleText: '0123 Monospace Currency' },
  { id: 'gaegu', label: 'Gaegu (Playful Hand)', familyName: "'Gaegu', cursive", sampleText: 'Playful Handwritten Title' },
  { id: 'display', label: 'Impact (Heavy Display)', familyName: "'Impact', sans-serif", sampleText: 'HEAVY IMPACT DISPLAY' },
];

const BRANDING_COLORS: { id: BrandingColor; label: string; previewClass: string }[] = [
  { id: 'default', label: 'Theme Gold', previewClass: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald Green', previewClass: 'bg-emerald-500' },
  { id: 'indigo', label: 'Royal Indigo', previewClass: 'bg-indigo-600' },
  { id: 'gold', label: 'Warm Gold', previewClass: 'bg-yellow-500' },
  { id: 'crimson', label: 'Crimson Red', previewClass: 'bg-rose-600' },
  { id: 'cyan', label: 'Cyber Cyan', previewClass: 'bg-cyan-500' },
  { id: 'purple', label: 'Violet Purple', previewClass: 'bg-purple-600' },
  { id: 'rose', label: 'Rose Pink', previewClass: 'bg-pink-500' },
  { id: 'orange', label: 'Sunset Orange', previewClass: 'bg-orange-500' },
];

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  language,
  onSelectLanguage,
  appVariation,
  onOpenThemeVariations,
  onOpenTypography,
  isRatio916 = true,
  onToggleRatio916,
  activeMember,
  familyMembers,
  memberConfigs,
  onSelectMember,
  onOpenManageMembers,
  adminPin,
  onOpenChangePinModal,
  onOpenExportImport,
  onOpenPdfSummary,
  onRunWeeklyBackup,
  onOpenWebLinkModal,
  brandingSettings,
  onUpdateBrandingSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'branding' | 'appearance' | 'language' | 'members' | 'data'>('all');

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleBrandingChange = (partial: Partial<AppBrandingSettings>) => {
    onUpdateBrandingSettings({
      ...brandingSettings,
      ...partial,
    });
  };

  const handleResetName = () => {
    handleBrandingChange({ appName: '' });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in touch-pan-y"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'ऐप सेटिंग्स एवं विकल्प' : 'App Settings & Preferences'}</span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'ऐप नाम, लोगो, रंग, फ़ॉन्ट, थीम, भाषा, सदस्य और बैकअप विकल्प'
                  : 'Customize App Name, Logo, Title Color, Fonts, Theme, Members & Backups'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Category Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: language === 'hi' ? 'सभी सेटिंग्स' : 'All Settings', icon: Settings },
            { id: 'branding', label: language === 'hi' ? 'नाम, लोगो व रंग' : 'Name, Logo & Color', icon: Sparkles },
            { id: 'appearance', label: language === 'hi' ? 'दिखावट एवं थीम' : 'Appearance', icon: Palette },
            { id: 'language', label: language === 'hi' ? 'भाषा (Language)' : 'Language', icon: Globe },
            { id: 'members', label: language === 'hi' ? 'सदस्य एवं सुरक्षा' : 'Members & PIN', icon: Users },
            { id: 'data', label: language === 'hi' ? 'डेटा एवं रिपोर्ट्स' : 'Data & Backup', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 overscroll-contain touch-pan-y">
          
          {/* CATEGORY 0: App Branding Customization (Name, Logo, Color, Font) */}
          {(activeTab === 'all' || activeTab === 'branding') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    1. {language === 'hi' ? 'ऐप का नाम, फ़ॉन्ट, रंग एवं लोगो' : 'App Name, Font, Color & Logo'}
                  </span>
                </h3>
                <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  Custom Branding
                </span>
              </div>

              {/* Live Header Branding Preview Box */}
              <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 dark:from-slate-800/80 dark:via-indigo-950/40 dark:to-slate-800/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3">
                  <AppLogo size={46} brandingSettings={brandingSettings} />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      Live Header Preview
                    </span>
                    <h4
                      className={`text-lg sm:text-xl font-black ${getBrandingColorClasses(
                        brandingSettings.color,
                        isDark
                      )}`}
                      style={{ fontFamily: getBrandingFontFamily(brandingSettings.font) }}
                    >
                      {brandingSettings.appName.trim() || t('appName', language)}
                    </h4>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {language === 'hi' ? 'लाइव प्रीव्यू' : 'App Header Preview'}
                </span>
              </div>

              {/* Feature 1: Update App Name */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-indigo-500" />
                    <span>App Name (Title)</span>
                  </label>
                  {brandingSettings.appName && (
                    <button
                      type="button"
                      onClick={handleResetName}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Default</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={brandingSettings.appName}
                  onChange={(e) => handleBrandingChange({ appName: e.target.value })}
                  placeholder={t('appName', language)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'hi'
                    ? 'अपनी पसंद का ऐप नाम दर्ज करें (उदा. गुप्ता फ़ैमिली बजट, माय वॉलेट)'
                    : 'Enter custom application name to display in the header and app title.'}
                </p>
              </div>

              {/* Feature 2: Change App Font */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-500" />
                  <span>App Title Font Style</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BRANDING_FONTS.map((fontOpt) => {
                    const isSelected = brandingSettings.font === fontOpt.id;
                    return (
                      <button
                        key={fontOpt.id}
                        type="button"
                        onClick={() => handleBrandingChange({ font: fontOpt.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-black ring-2 ring-indigo-400'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                        }`}
                      >
                        <span className="text-xs block font-extrabold mb-1">{fontOpt.label}</span>
                        <span
                          className="text-[11px] block opacity-90 truncate"
                          style={{ fontFamily: fontOpt.familyName }}
                        >
                          {fontOpt.sampleText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feature 3: Change App Title / Brand Color */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>App Title & Accent Color</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {BRANDING_COLORS.map((colorOpt) => {
                    const isSelected = brandingSettings.color === colorOpt.id;
                    return (
                      <button
                        key={colorOpt.id}
                        type="button"
                        onClick={() => handleBrandingChange({ color: colorOpt.id })}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-black ring-2 ring-indigo-400'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${colorOpt.previewClass}`} />
                        <span className="text-xs font-bold truncate">{colorOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feature 4: Change App Logo */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>App Logo Type</span>
                </label>

                {/* Logo Type Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'default', label: language === 'hi' ? 'डिफ़ॉल्ट लोगो' : 'Default SVG Logo', icon: Sparkles },
                    { id: 'preset', label: language === 'hi' ? 'वेक्टर आइकन' : 'Vector Icon Presets', icon: Wallet },
                    { id: 'emoji', label: language === 'hi' ? 'इमोजी लोगो' : 'Custom Emoji', icon: Smile },
                    { id: 'image', label: language === 'hi' ? 'फ़ोटो गैलरी व अपलोड' : 'Photo Gallery & Upload', icon: FolderOpen },
                  ].map((lt) => {
                    const isSelected = brandingSettings.logoType === lt.id;
                    const Icon = lt.icon;
                    return (
                      <button
                        key={lt.id}
                        type="button"
                        onClick={() => handleBrandingChange({ logoType: lt.id as LogoType })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-black'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-bold">{lt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-options based on chosen logo type */}
                {brandingSettings.logoType === 'preset' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                      Select Vector Icon Preset:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_ICONS.map((p) => {
                        const Icon = p.icon;
                        const isSelected = brandingSettings.presetIcon === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleBrandingChange({ presetIcon: p.id })}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                            }`}
                            title={p.label}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {brandingSettings.logoType === 'emoji' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                      Choose Emoji or Type Custom Emoji:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={brandingSettings.emojiIcon}
                        onChange={(e) => handleBrandingChange({ emojiIcon: e.target.value })}
                        maxLength={4}
                        placeholder="💰"
                        className="w-20 text-center px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-black focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex flex-wrap gap-1.5 overflow-x-auto">
                        {EMOJI_PRESETS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => handleBrandingChange({ emojiIcon: e })}
                            className={`p-1.5 text-lg rounded-xl border transition-all cursor-pointer ${
                              brandingSettings.emojiIcon === e
                                ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {brandingSettings.logoType === 'image' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-4">
                    {/* Upload from device / photo gallery */}
                    <div className="space-y-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        {language === 'hi' ? 'गैलरी / डिवाइस से फोटो चुनें' : 'Choose Photo from Device / Gallery'}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95">
                          <Upload className="w-4 h-4" />
                          <span>{language === 'hi' ? 'गैलरी से अपलोड करें' : 'Upload from Photo Gallery'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert(language === 'hi' ? 'कृपया 5MB से कम आकार की फ़ाइल चुनें' : 'Please select an image smaller than 5MB');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const res = evt.target?.result as string;
                                  if (res) {
                                    handleBrandingChange({ logoType: 'image', imageUrl: res });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {brandingSettings.imageUrl && (
                          <button
                            type="button"
                            onClick={() => handleBrandingChange({ imageUrl: '' })}
                            className="p-3 bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-rose-300 dark:border-rose-800"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{language === 'hi' ? 'हटाएं' : 'Remove Logo'}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'hi'
                          ? 'अपनी गैलरी से कोई भी फोटो, लोगो या ब्रांड इमेज चुनें (PNG, JPG, WebP)'
                          : 'Select any photo, custom logo or brand image from your device gallery (PNG, JPG, WebP)'}
                      </p>
                    </div>

                    {/* Current Selected Gallery Image Preview */}
                    {brandingSettings.imageUrl && (
                      <div className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center gap-3">
                        <img
                          src={brandingSettings.imageUrl}
                          alt="Uploaded Gallery Logo"
                          className="w-12 h-12 rounded-xl object-cover border border-indigo-300 dark:border-indigo-700 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 block truncate">
                            {language === 'hi' ? 'चयनित गैलरी लोगो' : 'Active Gallery Logo'}
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono block truncate">
                            {brandingSettings.imageUrl.startsWith('data:')
                              ? 'Uploaded Photo (Local File)'
                              : brandingSettings.imageUrl}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sample Preset Gallery Options */}
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                        {language === 'hi' ? 'गैलरी नमूने (Sample Gallery Collection):' : 'Sample Gallery Collection:'}
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {GALLERY_PRESETS.map((gp) => {
                          const isSelected = brandingSettings.imageUrl === gp.url;
                          return (
                            <button
                              key={gp.id}
                              type="button"
                              onClick={() => handleBrandingChange({ logoType: 'image', imageUrl: gp.url })}
                              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                              }`}
                              title={gp.title}
                            >
                              <img
                                src={gp.url}
                                alt={gp.title}
                                className="w-8 h-8 rounded-lg object-cover shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-extrabold truncate max-w-[65px]">{gp.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct Web Image Link Input (Secondary / Advanced) */}
                    <details className="text-xs group">
                      <summary className="font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer select-none">
                        {language === 'hi' ? 'या वेब इमेज यूआरएल (Web Image URL) दर्ज करें' : 'Or paste a direct web image link (URL)'}
                      </summary>
                      <div className="mt-2 pt-2 space-y-1">
                        <input
                          type="url"
                          value={brandingSettings.imageUrl}
                          onChange={(e) => handleBrandingChange({ logoType: 'image', imageUrl: e.target.value })}
                          placeholder="https://example.com/my-logo.png"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 1: Appearance & Display */}
          {(activeTab === 'all' || activeTab === 'appearance') && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>2. {language === 'hi' ? 'दिखावट एवं स्टाइल (Appearance)' : 'Appearance & Visual Styling'}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Dark / Light Theme Toggle */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      {isDark ? 'Modern Dark Mode' : 'Clean Light Mode'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isDark ? 'Eye-friendly night colors' : 'Bright clear daytime colors'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    <span className="text-xs font-black">{isDark ? 'Switch Light' : 'Switch Dark'}</span>
                  </button>
                </div>

                {/* 20 Preset Themes Modal Trigger */}
                {onOpenThemeVariations && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Theme Styles (20 Presets)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] block">
                        Garamond, Emerald, Obsidian...
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenThemeVariations();
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>20 Themes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Typography & Letters Modal Trigger */}
                {onOpenTypography && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Letters & Typography (Aa)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Bold, Thin, Cases, Spacing, Fonts
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTypography();
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Letters</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 9:16 Smartphone Mode Toggle */}
                {onToggleRatio916 && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        9:16 Smartphone View
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isRatio916 ? 'Phone canvas frame active' : 'Full desktop width active'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleRatio916}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isRatio916
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{isRatio916 ? '9:16 Phone' : 'Full Screen'}</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* CATEGORY 2: Language Options */}
          {(activeTab === 'all' || activeTab === 'language') && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>3. {language === 'hi' ? 'ऐप भाषा (Select Language)' : 'App Language Selection'}</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => onSelectLanguage(opt.code as Language)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-black'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs block font-bold">{opt.nativeName}</span>
                        <span className={`text-[10px] block ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {opt.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CATEGORY 3: Family Profiles & Members */}
          {(activeTab === 'all' || activeTab === 'members') && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>4. {language === 'hi' ? 'परिवार सदस्य एवं प्रोफ़ाइल' : 'Family Members & Active Profile'}</span>
                </h3>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      Current Active Member: <span className="text-indigo-600 dark:text-indigo-400 font-black">{activeMember}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Switch profile or manage member list & photos
                    </span>
                  </div>

                  {onOpenManageMembers && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenManageMembers();
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Manage Members</span>
                    </button>
                  )}
                </div>

                {/* Quick Member Selector Bar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                  {familyMembers.map((m) => {
                    const isActive = activeMember === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onSelectMember(m as FamilyMember)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <MemberAvatar member={m} memberConfigs={memberConfigs} size="xs" isActive={isActive} />
                        <span>{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Security PIN */}
              {onOpenChangePinModal && (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Admin Security PIN Code</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      PIN status: <strong className="text-emerald-600 dark:text-emerald-400">{adminPin ? 'Protected (Active)' : 'Default (0000)'}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChangePinModal();
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Change PIN</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* CATEGORY 4: Data & Backup */}
          {(activeTab === 'all' || activeTab === 'data') && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-500" />
                  <span>5. {language === 'hi' ? 'बैकअप, रिपोर्ट एवं डेटा' : 'Data Backup, Reports & Sharing'}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Automated 7-Day Weekly Backup Card */}
                <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between sm:col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {language === 'hi' ? 'ऑटोमेटेड 7-दिवसीय वीकली बैकअप (Weekly Auto-Backup)' : 'Automated 7-Day Weekly Backup'}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                          Active (7 Days)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === 'hi'
                          ? 'हर 7 दिन में स्वतः आपकी पूरी वित्तीय रिपोर्ट का सुरक्षित PDF बैकअप जनरेट होता है।'
                          : 'Automatically generates and saves a full PDF backup every 7 days.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onRunWeeklyBackup) {
                        onRunWeeklyBackup();
                      } else if (onOpenPdfSummary) {
                        onOpenPdfSummary();
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'अभी वीकली बैकअप लें' : 'Run Weekly Backup'}</span>
                  </button>
                </div>

                {/* Export & Import Modal */}
                {onOpenExportImport && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Export / Import Backup
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        JSON, CSV & Restore data
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExportImport();
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Backup</span>
                    </button>
                  </div>
                )}

                {/* PDF Summary Report */}
                {onOpenPdfSummary && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Monthly PDF Summary
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Download / Print PDF report
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPdfSummary();
                      }}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                )}

                {/* Share App Link & QR */}

                {/* Share App Link & QR */}
                {onOpenWebLinkModal && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between sm:col-span-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Share App & QR Code
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Copy link or scan QR code on mobile devices
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWebLinkModal();
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share App</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Family Expense Tracker Settings</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {t('close', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
