export type LetterWeightOption =
  | 'default'
  | 'thin'
  | 'extra-light'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';

export type LetterCaseOption = 'default' | 'uppercase' | 'lowercase' | 'capitalize';

export type LetterSpacingOption = 'default' | 'tight' | 'normal' | 'wide' | 'extrawide';

export type LetterFontOption = 'default' | 'inter' | 'garamond' | 'mono' | 'gaegu' | 'syne';

export interface TypographySettings {
  letterWeight: LetterWeightOption;
  letterCase: LetterCaseOption;
  letterSpacing: LetterSpacingOption;
  letterFont: LetterFontOption;
}

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  letterWeight: 'default',
  letterCase: 'default',
  letterSpacing: 'default',
  letterFont: 'default',
};

const STORAGE_KEY = 'family_app_typography_settings_v1';

export function getSavedTypographySettings(): TypographySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_TYPOGRAPHY_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load typography settings:', e);
  }
  return DEFAULT_TYPOGRAPHY_SETTINGS;
}

export function applyTypographySettings(settings: TypographySettings) {
  const root = document.documentElement;

  if (settings.letterWeight && settings.letterWeight !== 'default') {
    root.setAttribute('data-letter-weight', settings.letterWeight);
  } else {
    root.removeAttribute('data-letter-weight');
  }

  if (settings.letterCase && settings.letterCase !== 'default') {
    root.setAttribute('data-letter-case', settings.letterCase);
  } else {
    root.removeAttribute('data-letter-case');
  }

  if (settings.letterSpacing && settings.letterSpacing !== 'default') {
    root.setAttribute('data-letter-spacing', settings.letterSpacing);
  } else {
    root.removeAttribute('data-letter-spacing');
  }

  if (settings.letterFont && settings.letterFont !== 'default') {
    root.setAttribute('data-letter-font', settings.letterFont);
  } else {
    root.removeAttribute('data-letter-font');
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save typography settings:', e);
  }
}
