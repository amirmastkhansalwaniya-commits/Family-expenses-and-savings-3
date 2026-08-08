export interface AppVariation {
  id: string;
  name: string;
  nameHi: string;
  category: 'Classical' | 'Warm' | 'Tech' | 'Luxury' | 'Vibrant' | 'Dark';
  description: string;
  mode: 'light' | 'dark';
  fontHeading: string;
  fontBody: string;
  previewColors: {
    bg: string;
    card: string;
    ink: string;
    accent: string;
    secondary: string;
  };
  cssVars: {
    bg: string;
    card: string;
    ink: string;
    accent: string;
    inkFaint: string;
    danger: string;
    success: string;
    warning: string;
    indigo: string;
  };
}

export const APP_VARIATIONS: AppVariation[] = [
  {
    id: 'executive_garamond',
    name: 'Executive Garamond',
    nameHi: 'क्लासिक गार्मांड',
    category: 'Classical',
    description: 'Classical editorial aesthetic with Cormorant Garamond typography and gold accents.',
    mode: 'light',
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F8F7F4',
      card: '#FFFFFF',
      ink: '#1B1A17',
      accent: '#B8860B',
      secondary: '#15803D'
    },
    cssVars: {
      bg: '#F8F7F4',
      card: '#FFFFFF',
      ink: '#1B1A17',
      accent: '#B8860B',
      inkFaint: 'rgba(27, 26, 23, 0.1)',
      danger: '#B91C1C',
      success: '#15803D',
      warning: '#D97706',
      indigo: '#4F46E5'
    }
  },
  {
    id: 'warm_lifestyle',
    name: 'Warm Lifestyle',
    nameHi: 'वार्म लाइफस्टाइल',
    category: 'Warm',
    description: 'Cozy cream canvas with playful Gaegu font accents and soft coral highlights.',
    mode: 'light',
    fontHeading: "'Gaegu', cursive, sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#FFFDF5',
      card: '#FFFFFF',
      ink: '#2D2424',
      accent: '#FF6B6B',
      secondary: '#10B981'
    },
    cssVars: {
      bg: '#FFFDF5',
      card: '#FFFFFF',
      ink: '#2D2424',
      accent: '#FF6B6B',
      inkFaint: 'rgba(45, 36, 36, 0.1)',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      indigo: '#6366F1'
    }
  },
  {
    id: 'systematic_cyber',
    name: 'Systematic Cyber',
    nameHi: 'सिस्टमैटिक साइबर',
    category: 'Tech',
    description: 'Futuristic terminal theme with Syne bold headings and electric cyan accents.',
    mode: 'dark',
    fontHeading: "'Syne', sans-serif",
    fontBody: "'JetBrains Mono', monospace",
    previewColors: {
      bg: '#0C0C0E',
      card: '#18181B',
      ink: '#F2EFEB',
      accent: '#00F5FF',
      secondary: '#00FF94'
    },
    cssVars: {
      bg: '#0C0C0E',
      card: '#18181B',
      ink: '#F2EFEB',
      accent: '#00F5FF',
      inkFaint: 'rgba(242, 239, 235, 0.12)',
      danger: '#FF4D4D',
      success: '#00FF94',
      warning: '#FFD700',
      indigo: '#818CF8'
    }
  },
  {
    id: 'emerald_mint',
    name: 'Emerald Mint Wealth',
    nameHi: 'एमराल्ड मिंट',
    category: 'Warm',
    description: 'Refreshing mint green canvas with deep forest green financial indicators.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F0FDF4',
      card: '#FFFFFF',
      ink: '#064E3B',
      accent: '#059669',
      secondary: '#10B981'
    },
    cssVars: {
      bg: '#F0FDF4',
      card: '#FFFFFF',
      ink: '#064E3B',
      accent: '#059669',
      inkFaint: 'rgba(6, 78, 59, 0.1)',
      danger: '#DC2626',
      success: '#10B981',
      warning: '#D97706',
      indigo: '#0284C7'
    }
  },
  {
    id: 'sunset_amber',
    name: 'Sunset Amber',
    nameHi: 'सनसेट एंबर',
    category: 'Warm',
    description: 'Warm glowing amber background with burnt orange and terracotta notes.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#FFFBEB',
      card: '#FFFFFF',
      ink: '#78350F',
      accent: '#D97706',
      secondary: '#EA580C'
    },
    cssVars: {
      bg: '#FFFBEB',
      card: '#FFFFFF',
      ink: '#78350F',
      accent: '#D97706',
      inkFaint: 'rgba(120, 53, 15, 0.1)',
      danger: '#DC2626',
      success: '#16A34A',
      warning: '#F59E0B',
      indigo: '#7C3AED'
    }
  },
  {
    id: 'royal_indigo',
    name: 'Royal Indigo',
    nameHi: 'रॉयल इंडिगो',
    category: 'Luxury',
    description: 'Midnight slate navy canvas with glowing violet and deep indigo highlights.',
    mode: 'dark',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#0F172A',
      card: '#1E293B',
      ink: '#F8FAFC',
      accent: '#6366F1',
      secondary: '#8B5CF6'
    },
    cssVars: {
      bg: '#0F172A',
      card: '#1E293B',
      ink: '#F8FAFC',
      accent: '#6366F1',
      inkFaint: 'rgba(248, 250, 252, 0.12)',
      danger: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
      indigo: '#818CF8'
    }
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    nameHi: 'साइबरपंक नियॉन',
    category: 'Vibrant',
    description: 'High-energy dark mode with hot magenta pink and electric blue accents.',
    mode: 'dark',
    fontHeading: "'Syne', sans-serif",
    fontBody: "'JetBrains Mono', monospace",
    previewColors: {
      bg: '#05050A',
      card: '#121124',
      ink: '#FFFFFF',
      accent: '#EC4899',
      secondary: '#3B82F6'
    },
    cssVars: {
      bg: '#05050A',
      card: '#121124',
      ink: '#FFFFFF',
      accent: '#EC4899',
      inkFaint: 'rgba(255, 255, 255, 0.15)',
      danger: '#FF2A6D',
      success: '#05FFA1',
      warning: '#FFC800',
      indigo: '#00F0FF'
    }
  },
  {
    id: 'nordic_frost',
    name: 'Nordic Frost',
    nameHi: 'नॉर्डिक फ्रॉस्ट',
    category: 'Vibrant',
    description: 'Crisp Scandinavian icy blue theme with clean slate typography.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      ink: '#0F172A',
      accent: '#0284C7',
      secondary: '#06B6D4'
    },
    cssVars: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      ink: '#0F172A',
      accent: '#0284C7',
      inkFaint: 'rgba(15, 23, 42, 0.08)',
      danger: '#E11D48',
      success: '#0D9488',
      warning: '#D97706',
      indigo: '#2563EB'
    }
  },
  {
    id: 'coffee_latte',
    name: 'Coffee Latte',
    nameHi: 'कॉफी लट्टे',
    category: 'Warm',
    description: 'Soothing warm latte canvas with espresso roast typography and caramel tones.',
    mode: 'light',
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F5EBE0',
      card: '#FFFFFF',
      ink: '#271C19',
      accent: '#9C6644',
      secondary: '#7F5539'
    },
    cssVars: {
      bg: '#F5EBE0',
      card: '#FFFFFF',
      ink: '#271C19',
      accent: '#9C6644',
      inkFaint: 'rgba(39, 28, 25, 0.1)',
      danger: '#B91C1C',
      success: '#2E7D32',
      warning: '#D97706',
      indigo: '#6D28D9'
    }
  },
  {
    id: 'rose_gold',
    name: 'Rose Gold Luxe',
    nameHi: 'रोज़ गोल्ड लक्स',
    category: 'Luxury',
    description: 'Soft blush pink aesthetic with shimmering rose gold borders and crimson highlights.',
    mode: 'light',
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#FFF1F2',
      card: '#FFFFFF',
      ink: '#881337',
      accent: '#E11D48',
      secondary: '#F43F5E'
    },
    cssVars: {
      bg: '#FFF1F2',
      card: '#FFFFFF',
      ink: '#881337',
      accent: '#E11D48',
      inkFaint: 'rgba(136, 19, 55, 0.08)',
      danger: '#BE123C',
      success: '#059669',
      warning: '#D97706',
      indigo: '#7C3AED'
    }
  },
  {
    id: 'terracotta_earth',
    name: 'Terracotta Earth',
    nameHi: 'टेराकोटा अर्थ',
    category: 'Warm',
    description: 'Earthy organic clay tones paired with sage green and burnt orange accents.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#FAF5F0',
      card: '#FFFFFF',
      ink: '#431407',
      accent: '#C2410C',
      secondary: '#15803D'
    },
    cssVars: {
      bg: '#FAF5F0',
      card: '#FFFFFF',
      ink: '#431407',
      accent: '#C2410C',
      inkFaint: 'rgba(67, 20, 7, 0.1)',
      danger: '#991B1B',
      success: '#15803D',
      warning: '#B45309',
      indigo: '#4338CA'
    }
  },
  {
    id: 'monokai_developer',
    name: 'Monokai Developer',
    nameHi: 'मोनोकाई डेवलपर',
    category: 'Dark',
    description: 'Classic code editor atmosphere with dark violet-grey canvas and vibrant syntax highlights.',
    mode: 'dark',
    fontHeading: "'JetBrains Mono', monospace",
    fontBody: "'JetBrains Mono', monospace",
    previewColors: {
      bg: '#1E1E2E',
      card: '#27293D',
      ink: '#F8F8F2',
      accent: '#A6E22E',
      secondary: '#FD971F'
    },
    cssVars: {
      bg: '#1E1E2E',
      card: '#27293D',
      ink: '#F8F8F2',
      accent: '#A6E22E',
      inkFaint: 'rgba(248, 248, 242, 0.12)',
      danger: '#F92672',
      success: '#A6E22E',
      warning: '#E6DB74',
      indigo: '#66D9EF'
    }
  },
  {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    nameHi: 'ओशियन ब्रीज़',
    category: 'Vibrant',
    description: 'Refreshing sea aqua background with deep sapphire blue metrics.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F0F9FF',
      card: '#FFFFFF',
      ink: '#0C4A6E',
      accent: '#0284C7',
      secondary: '#0D9488'
    },
    cssVars: {
      bg: '#F0F9FF',
      card: '#FFFFFF',
      ink: '#0C4A6E',
      accent: '#0284C7',
      inkFaint: 'rgba(12, 74, 110, 0.08)',
      danger: '#E11D48',
      success: '#0D9488',
      warning: '#D97706',
      indigo: '#4F46E5'
    }
  },
  {
    id: 'midnight_sapphire',
    name: 'Midnight Sapphire',
    nameHi: 'मिडनाइट नीलम',
    category: 'Dark',
    description: 'Ultra-deep navy dark canvas with electric sapphire blue and crisp white typography.',
    mode: 'dark',
    fontHeading: "'Syne', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#030712',
      card: '#111827',
      ink: '#F9FAFB',
      accent: '#2563EB',
      secondary: '#38BDF8'
    },
    cssVars: {
      bg: '#030712',
      card: '#111827',
      ink: '#F9FAFB',
      accent: '#2563EB',
      inkFaint: 'rgba(249, 250, 251, 0.12)',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      indigo: '#6366F1'
    }
  },
  {
    id: 'forest_pine',
    name: 'Forest Pine',
    nameHi: 'फॉरेस्ट पाइन',
    category: 'Dark',
    description: 'Soothing dark pine canopy with soft golden sunlit highlights.',
    mode: 'dark',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#0A1F14',
      card: '#142E1F',
      ink: '#ECFDF5',
      accent: '#10B981',
      secondary: '#EAB308'
    },
    cssVars: {
      bg: '#0A1F14',
      card: '#142E1F',
      ink: '#ECFDF5',
      accent: '#10B981',
      inkFaint: 'rgba(236, 253, 245, 0.12)',
      danger: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
      indigo: '#38BDF8'
    }
  },
  {
    id: 'slate_minimalist',
    name: 'Slate Minimalist',
    nameHi: 'स्लेट मिनिमलिस्ट',
    category: 'Classical',
    description: 'High-contrast monochrome slate layout focused strictly on content and numbers.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F1F5F9',
      card: '#FFFFFF',
      ink: '#0F172A',
      accent: '#334155',
      secondary: '#475569'
    },
    cssVars: {
      bg: '#F1F5F9',
      card: '#FFFFFF',
      ink: '#0F172A',
      accent: '#334155',
      inkFaint: 'rgba(15, 23, 42, 0.1)',
      danger: '#991B1B',
      success: '#166534',
      warning: '#854D0E',
      indigo: '#1E40AF'
    }
  },
  {
    id: 'lavender_dream',
    name: 'Lavender Dream',
    nameHi: 'लैवेंडर ड्रीम',
    category: 'Vibrant',
    description: 'Soft pastel lavender background with regal violet accents and smooth glow.',
    mode: 'light',
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#F5F3FF',
      card: '#FFFFFF',
      ink: '#3B0764',
      accent: '#7C3AED',
      secondary: '#A855F7'
    },
    cssVars: {
      bg: '#F5F3FF',
      card: '#FFFFFF',
      ink: '#3B0764',
      accent: '#7C3AED',
      inkFaint: 'rgba(59, 7, 100, 0.08)',
      danger: '#DC2626',
      success: '#0D9488',
      warning: '#D97706',
      indigo: '#6366F1'
    }
  },
  {
    id: 'high_contrast_dark',
    name: 'High Contrast OLED',
    nameHi: 'हाई कॉन्ट्रास्ट डार्क',
    category: 'Dark',
    description: 'Pure OLED pitch black canvas with bright neon yellow indicators for maximum night clarity.',
    mode: 'dark',
    fontHeading: "'Syne', sans-serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#000000',
      card: '#121212',
      ink: '#FFFFFF',
      accent: '#FACC15',
      secondary: '#22C55E'
    },
    cssVars: {
      bg: '#000000',
      card: '#121212',
      ink: '#FFFFFF',
      accent: '#FACC15',
      inkFaint: 'rgba(255, 255, 255, 0.2)',
      danger: '#EF4444',
      success: '#22C55E',
      warning: '#FACC15',
      indigo: '#38BDF8'
    }
  },
  {
    id: 'golden_luxe',
    name: 'Imperial Golden Luxe',
    nameHi: 'इंपीरियल गोल्ड लक्स',
    category: 'Luxury',
    description: 'Ultra-luxurious dark canvas with champagne gold borders and metallic sheen.',
    mode: 'dark',
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Inter', sans-serif",
    previewColors: {
      bg: '#0A0A0A',
      card: '#171717',
      ink: '#FAFAFA',
      accent: '#F59E0B',
      secondary: '#D97706'
    },
    cssVars: {
      bg: '#0A0A0A',
      card: '#171717',
      ink: '#FAFAFA',
      accent: '#F59E0B',
      inkFaint: 'rgba(245, 158, 11, 0.2)',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      indigo: '#818CF8'
    }
  },
  {
    id: 'retro_arcade',
    name: 'Retro Arcade 80s',
    nameHi: 'रेट्रो आर्केड',
    category: 'Vibrant',
    description: 'Playful synthwave atmosphere with neon magenta, yellow and cyan accents.',
    mode: 'dark',
    fontHeading: "'Syne', sans-serif",
    fontBody: "'JetBrains Mono', monospace",
    previewColors: {
      bg: '#180B28',
      card: '#2A1245',
      ink: '#F8FAF3',
      accent: '#FACC15',
      secondary: '#E11D48'
    },
    cssVars: {
      bg: '#180B28',
      card: '#2A1245',
      ink: '#F8FAF3',
      accent: '#FACC15',
      inkFaint: 'rgba(248, 250, 243, 0.15)',
      danger: '#FF0055',
      success: '#00FFCC',
      warning: '#FACC15',
      indigo: '#8B5CF6'
    }
  }
];

export function getVariationById(id: string): AppVariation {
  return APP_VARIATIONS.find(v => v.id === id) || APP_VARIATIONS[0];
}

export function applyVariation(variationId: string) {
  const variation = getVariationById(variationId);
  const root = document.documentElement;

  // Apply root CSS variables
  root.style.setProperty('--bg', variation.cssVars.bg);
  root.style.setProperty('--card', variation.cssVars.card);
  root.style.setProperty('--ink', variation.cssVars.ink);
  root.style.setProperty('--accent', variation.cssVars.accent);
  root.style.setProperty('--ink-faint', variation.cssVars.inkFaint);
  root.style.setProperty('--danger', variation.cssVars.danger);
  root.style.setProperty('--success', variation.cssVars.success);
  root.style.setProperty('--warning', variation.cssVars.warning);
  root.style.setProperty('--indigo', variation.cssVars.indigo);

  // Set data attribute for targeted styling
  root.setAttribute('data-variation', variation.id);

  // Update dark mode class
  if (variation.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Save to localStorage
  localStorage.setItem('family_app_variation', variation.id);
  localStorage.setItem('family_app_theme', variation.mode);
}
