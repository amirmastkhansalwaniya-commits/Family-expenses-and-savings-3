import type { CSSProperties } from 'react';

export type LogoType = 'default' | 'preset' | 'emoji' | 'image';

export type PresetLogoIcon = 'wallet' | 'piggy' | 'shield' | 'gem' | 'home' | 'crown' | 'chart' | 'coins';

export type BrandingFont = 'default' | 'inter' | 'garamond' | 'syne' | 'mono' | 'gaegu' | 'serif' | 'display';

export type BrandingColor = 'default' | 'gold' | 'emerald' | 'indigo' | 'crimson' | 'cyan' | 'purple' | 'rose' | 'orange';

export interface AppBrandingSettings {
  appName: string;
  logoType: LogoType;
  presetIcon: PresetLogoIcon;
  emojiIcon: string;
  imageUrl: string;
  font: BrandingFont;
  color: BrandingColor;
  customHexColor?: string;
}

export const DEFAULT_BRANDING_SETTINGS: AppBrandingSettings = {
  appName: '', // Empty means fall back to default translated app name
  logoType: 'default',
  presetIcon: 'wallet',
  emojiIcon: '💰',
  imageUrl: '',
  font: 'default',
  color: 'default',
  customHexColor: '',
};

const STORAGE_KEY = 'family_app_branding_settings_v1';

export function getSavedBrandingSettings(): AppBrandingSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_BRANDING_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load branding settings:', e);
  }
  return DEFAULT_BRANDING_SETTINGS;
}

export function saveBrandingSettings(settings: AppBrandingSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Dispatch a custom event so components can update if needed
    window.dispatchEvent(new Event('app_branding_updated'));
  } catch (e) {
    console.error('Failed to save branding settings:', e);
  }
}

export function getBrandingColorClasses(color: BrandingColor, isDark: boolean) {
  switch (color) {
    case 'gold':
      return isDark ? 'text-amber-400' : 'text-amber-700';
    case 'emerald':
      return isDark ? 'text-emerald-400' : 'text-emerald-700';
    case 'indigo':
      return isDark ? 'text-indigo-400' : 'text-indigo-700';
    case 'crimson':
      return isDark ? 'text-rose-400' : 'text-rose-700';
    case 'cyan':
      return isDark ? 'text-cyan-400' : 'text-cyan-700';
    case 'purple':
      return isDark ? 'text-purple-400' : 'text-purple-700';
    case 'rose':
      return isDark ? 'text-pink-400' : 'text-pink-700';
    case 'orange':
      return isDark ? 'text-orange-400' : 'text-orange-700';
    default:
      return isDark ? 'text-yellow-400 title-3d-dark-green-dark' : 'text-amber-700 title-3d-dark-green-light';
  }
}

export function getBrandingFontFamily(font: BrandingFont): string {
  switch (font) {
    case 'inter':
      return "'Inter', sans-serif";
    case 'garamond':
      return "'Cormorant Garamond', Georgia, serif";
    case 'syne':
      return "'Syne', sans-serif";
    case 'mono':
      return "'JetBrains Mono', monospace";
    case 'gaegu':
      return "'Gaegu', cursive";
    case 'serif':
      return "Georgia, serif";
    case 'display':
      return "'Impact', sans-serif";
    default:
      return 'inherit';
  }
}

export function getHeaderTitle(brandingSettings?: AppBrandingSettings, defaultTitle: string = 'Family Expense Tracker'): string {
  if (brandingSettings?.appName && brandingSettings.appName.trim().length > 0) {
    return brandingSettings.appName.trim();
  }
  return defaultTitle;
}

export function getHeaderColorClass(brandingSettings?: AppBrandingSettings, isDark: boolean = false): string {
  if (brandingSettings?.color) {
    return getBrandingColorClasses(brandingSettings.color, isDark);
  }
  return isDark
    ? 'text-yellow-400 title-3d-dark-green-dark'
    : 'text-amber-700 title-3d-dark-green-light';
}

export function getHeaderFontStyle(brandingSettings?: AppBrandingSettings): CSSProperties | undefined {
  if (!brandingSettings?.font) return undefined;
  const family = getBrandingFontFamily(brandingSettings.font);
  return family && family !== 'inherit' ? { fontFamily: family } : undefined;
}

