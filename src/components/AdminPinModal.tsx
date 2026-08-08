import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, X, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeOff, Key, Sparkles, RefreshCw } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentAdminPin: string;
  onUpdatePin: (newPin: string) => Promise<void> | void;
  adminName?: string;
  theme?: 'light' | 'dark';
  initialMode?: 'verify' | 'change';
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentAdminPin,
  onUpdatePin,
  adminName = 'Aamir Khan',
  theme = 'light',
  initialMode = 'verify',
}) => {
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<'verify' | 'change'>(initialMode);

  // Verification state
  const [pinInputs, setPinInputs] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Change PIN state
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [changeError, setChangeError] = useState<string>('');
  const [changeSuccess, setChangeSuccess] = useState<string>('');
  const [isSavingPin, setIsSavingPin] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setMode(initialMode);
      setPinInputs(['', '', '', '']);
      setErrorMsg('');
      setIsSuccess(false);
      setIsVerifying(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setChangeError('');
      setChangeSuccess('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Verify PIN digit inputs
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean && val !== '') return;

    const newInputs = [...pinInputs];
    newInputs[index] = clean.slice(-1);
    setPinInputs(newInputs);
    setErrorMsg('');

    if (clean && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasted) return;

    const newInputs = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newInputs[i] = pasted[i];
    }
    setPinInputs(newInputs);
    setErrorMsg('');
    if (pasted.length === 4) {
      inputRefs.current[3]?.focus();
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerifyPinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = pinInputs.join('');
    if (entered.length < 4) {
      setErrorMsg('Please enter all 4 digits of the Admin PIN.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (entered === currentAdminPin) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } else {
        setErrorMsg('Incorrect Security PIN. Please try again or reset PIN.');
      }
    }, 300);
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (oldPin !== currentAdminPin) {
      setChangeError('Current Admin PIN is incorrect.');
      return;
    }

    if (newPin.length < 4 || !/^\d{4,6}$/.test(newPin)) {
      setChangeError('New PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setChangeError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsSavingPin(true);
    try {
      await onUpdatePin(newPin);
      setChangeSuccess('Admin Security PIN updated successfully!');
      setIsSavingPin(false);
      setTimeout(() => {
        setMode('verify');
        setPinInputs(['', '', '', '']);
        setChangeSuccess('');
      }, 1200);
    } catch (err) {
      setIsSavingPin(false);
      setChangeError('Failed to save new PIN to database. Please retry.');
    }
  };

  const handleResetToDefaultPin = async () => {
    await onUpdatePin('1234');
    setChangeSuccess('PIN reset to default "1234". You can now enter 1234.');
    setPinInputs(['1', '2', '3', '4']);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">
                {mode === 'verify' ? 'Admin Access Security PIN' : 'Change Admin Security PIN'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Profile: <strong>{adminName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('verify');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'verify'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Verify PIN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('change');
              setChangeError('');
              setChangeSuccess('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'change'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Change PIN Code
          </button>
        </div>

        {/* VERIFY PIN MODE */}
        {mode === 'verify' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-full">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Enter 4-Digit Security PIN</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Enter your security PIN code to access Administrator privileges.
              </p>
            </div>

            <form onSubmit={handleVerifyPinSubmit} className="space-y-4 pt-1">
              <div className="flex items-center justify-center gap-3">
                {pinInputs.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isVerifying || isSuccess}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center font-mono font-black text-2xl rounded-2xl border-2 transition-all outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                    } ${errorMsg ? 'border-rose-500 text-rose-600' : ''}`}
                  />
                ))}
              </div>

              {/* Show / Hide PIN Toggle */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Message */}
              {isSuccess && (
                <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-150">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>PIN Verified! Switching to {adminName}...</span>
                </div>
              )}

              {/* Submit & Reset Helper */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isVerifying || isSuccess || pinInputs.join('').length < 4}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <span>Verifying PIN...</span>
                  ) : isSuccess ? (
                    <span>Access Granted</span>
                  ) : (
                    <>
                      <span>Submit PIN & Switch to Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs px-1 pt-1">
                  <button
                    type="button"
                    onClick={handleResetToDefaultPin}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset PIN to Default (1234)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* CHANGE PIN MODE */}
        {mode === 'change' && (
          <form onSubmit={handleChangePinSubmit} className="space-y-4 pt-1">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Admin PIN Code
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter current PIN (Default: 1234)"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-bold transition-all outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Admin PIN Code (4-6 Digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 5678"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-bold transition-all outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New PIN Code
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Re-enter new PIN"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-bold transition-all outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>
            </div>

            {/* Change Error */}
            {changeError && (
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            {/* Change Success */}
            {changeSuccess && (
              <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{changeSuccess}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPin || !oldPin || !newPin || !confirmPin}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Key className="w-4 h-4" />
                <span>{isSavingPin ? 'Saving PIN...' : 'Save New PIN'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
