import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check, ExternalLink, Share2, Smartphone, X, QrCode, ShieldCheck, ArrowRight } from 'lucide-react';
import { Language, t } from '../utils/translations';

interface WebAppLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  language: Language;
}

export const WebAppLinkModal: React.FC<WebAppLinkModalProps> = ({
  isOpen,
  onClose,
  theme,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'pwa'>('link');

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Determine current live web app URL
  const getWebAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin || window.location.href;
    }
    return 'https://ais-dev-igqharngeaqur34kynncza-773036351860.asia-southeast1.run.app';
  };

  const webAppUrl = getWebAppUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(webAppUrl)}&color=0f172a&bgcolor=ffffff`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(webAppUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Family Expenses & Wealth App',
          text: 'Open and access the Family Expenses & Wealth Web Application:',
          url: webAppUrl,
        });
      } catch (err) {
        console.log('Share canceled or error:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleOpenInNewTab = () => {
    window.open(webAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className={`relative rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-5 my-8 ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Family Web App Link</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share or bookmark app for instant device access</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'link'
                ? isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web App Link & QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Add to Home Screen</span>
          </button>
        </div>

        {/* TAB 1: WEB APP LINK & QR CODE */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {/* Link Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Web Application URL</span>
                {copied && (
                  <span className="text-emerald-500 font-bold flex items-center gap-1 lowercase text-[11px]">
                    <Check className="w-3 h-3" /> copied to clipboard!
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webAppUrl}
                  className={`flex-1 px-3.5 py-2.5 rounded-2xl text-xs font-mono font-bold border focus:outline-none select-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <Share2 className="w-4 h-4 text-indigo-500" />
                <span>Share App Link</span>
              </button>

              <button
                type="button"
                onClick={handleOpenInNewTab}
                className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <ExternalLink className="w-4 h-4 text-emerald-500" />
                <span>Open New Tab</span>
              </button>
            </div>

            {/* QR Code Card */}
            <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center gap-4 ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-indigo-50/50 border-indigo-100'
            }`}>
              <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Web App QR Code"
                  className="w-28 h-28 object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback visual if external API is unreachable
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                  <QrCode className="w-4 h-4" />
                  <span>Scan with Phone Camera</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Open your camera on iPhone or Android to quickly load and sync this Web Application on mobile devices.
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Real-time Firebase database sync enables multi-device family expense tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PWA / ADD TO HOME SCREEN */}
        {activeTab === 'pwa' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              You can save this Web Application as an icon on your home screen for 1-tap app access:
            </p>

            <div className="space-y-2.5">
              {/* Android Instructions */}
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Android (Chrome / Edge)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                  <li>Open this Web App link in Google Chrome</li>
                  <li>Tap the menu button (<strong>⋮</strong> three dots in top right)</li>
                  <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                </ol>
              </div>

              {/* iOS Instructions */}
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>iPhone & iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                  <li>Open this link in <strong>Safari browser</strong></li>
                  <li>Tap the <strong>Share button</strong> (square with arrow pointing up)</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                </ol>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>Web app automatically remembers your active profile & keeps data in real-time sync.</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
