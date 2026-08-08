import React, { useState, useRef } from 'react';
import { MemberCustomConfig, getMemberTheme, Expense, MemberBankAmount, EmiPlan } from '../types';
import { X, UserPlus, Trash2, Edit3, Camera, Upload, Check, Users, Palette, Smile, ShieldAlert, Image as ImageIcon, Lock, Eye, EyeOff, AlertCircle, Key, Download } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { exportMemberDataToCSV, exportMemberDataToPDF, exportMemberDataToJSON } from '../utils/exportImport';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: string[];
  memberConfigs: Record<string, MemberCustomConfig>;
  onAddMember: (name: string, config: MemberCustomConfig) => Promise<void>;
  onUpdateMember: (oldName: string, newName: string, config: MemberCustomConfig) => Promise<void>;
  onRemoveMember: (name: string) => Promise<void>;
  adminPin?: string;
  theme?: 'light' | 'dark';
  onOpenChangePinModal?: () => void;
  expenses?: Expense[];
  memberBankAmounts?: Record<string, MemberBankAmount>;
  emis?: EmiPlan[];
}

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
];

const PRESET_EMOJIS = [
  '🧔‍♂️', '👨', '👩', '🧔', '🧕', '👩‍🎓', '👴', '👵', 
  '🧑‍💻', '👧', '👦', '👑', '💼', '⚡', '🌟', '🦊', 
  '🐱', '🌸', '🎯', '🎨', '⚽', '🍕', '🚀', '💎'
];

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  familyMembers,
  memberConfigs,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  adminPin,
  theme = 'light',
  onOpenChangePinModal,
  expenses = [],
  memberBankAmounts = {},
  emis = [],
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-view or editing state
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Remove Member PIN state
  const [removePin, setRemovePin] = useState<string>('');
  const [removePinError, setRemovePinError] = useState<string | null>(null);
  const [showRemovePin, setShowRemovePin] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formColor, setFormColor] = useState<string>('indigo');
  const [formEmoji, setFormEmoji] = useState<string>('👤');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingMember(null);
    setIsAddingNew(true);
    setFormName('');
    setFormColor('indigo');
    setFormEmoji('👤');
    setFormPhotoUrl(undefined);
    setErrorMsg(null);
  };

  const handleOpenEditForm = (member: string) => {
    const existing = memberConfigs[member];
    setEditingMember(member);
    setIsAddingNew(false);
    setFormName(member);
    setFormColor(existing?.color || 'indigo');
    setFormEmoji(existing?.emoji || '👤');
    setFormPhotoUrl(existing?.photoUrl);
    setErrorMsg(null);
  };

  const handleCloseForm = () => {
    setEditingMember(null);
    setIsAddingNew(false);
    setErrorMsg(null);
  };

  // Image Upload with Canvas Compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 250; // max 250x250 square for clean avatar
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormPhotoUrl(compressed);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setErrorMsg('Member name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const configData: MemberCustomConfig = {
        name: trimmedName,
        color: formColor,
        emoji: formEmoji,
        photoUrl: formPhotoUrl,
      };

      if (isAddingNew) {
        if (familyMembers.some((m) => m.toLowerCase() === trimmedName.toLowerCase())) {
          setErrorMsg(`A member named "${trimmedName}" already exists.`);
          setIsSaving(false);
          return;
        }
        await onAddMember(trimmedName, configData);
      } else if (editingMember) {
        await onUpdateMember(editingMember, trimmedName, configData);
      }

      handleCloseForm();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save member details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateRemove = (member: string) => {
    setMemberToRemove(member);
    setRemovePin('');
    setRemovePinError(null);
    setShowRemovePin(false);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    const expectedPin = adminPin || '1234';
    if (removePin !== expectedPin) {
      setRemovePinError('Incorrect Admin Security PIN. Please enter the correct PIN code.');
      return;
    }

    setIsSaving(true);
    try {
      await onRemoveMember(memberToRemove);
      setMemberToRemove(null);
      setRemovePin('');
      setRemovePinError(null);
    } catch (err: any) {
      setRemovePinError(err?.message || 'Failed to remove member');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border my-auto transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">Manage Family Members</h3>
              <p className="text-xs text-slate-400 font-medium">Add, edit, or remove member profiles & photos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenChangePinModal && (
              <button
                type="button"
                onClick={onOpenChangePinModal}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Change Admin Security PIN Code"
              >
                <Key className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Change PIN</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-4 space-y-4">
          
          {/* Add / Edit Form Overlay Mode */}
          {(isAddingNew || editingMember) ? (
            <form onSubmit={handleSaveForm} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {isAddingNew ? '➕ Add New Family Member' : `✏️ Edit Profile: ${editingMember}`}
                </h4>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Back to List
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Member Name */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Member Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul, Priya, Mom, Dad"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-black border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Gallery Photo Upload Section */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <span>Profile Photo (Upload from Gallery)</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Photo Preview / Fallback */}
                  <div className="relative">
                    {formPhotoUrl ? (
                      <img
                        src={formPhotoUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border-2 border-dashed border-indigo-400/50 flex flex-col items-center justify-center text-indigo-500">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[9px] font-extrabold mt-0.5">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Gallery Photo</span>
                      </button>

                      {formPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormPhotoUrl(undefined)}
                          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Select photo from gallery. Automatically compressed for fast offline & cloud sync.
                    </p>
                  </div>
                </div>
              </div>

              {/* Emoji Icon Picker */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Or Select Avatar Emoji Icon</span>
                  </span>
                  <span className="text-[10px] text-indigo-500 font-mono font-black">{formEmoji}</span>
                </label>
                <div className="grid grid-cols-8 gap-1.5 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormEmoji(emoji)}
                      className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                        formEmoji === emoji
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Profile Theme Color</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormColor(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer transition-transform ${
                        formColor === c.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-indigo-600 shadow-xs scale-105 ring-2 ring-indigo-500'
                          : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.bg}`}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : isAddingNew ? 'Add Member' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Member List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {familyMembers.map((member) => {
                  const themeConfig = getMemberTheme(member, memberConfigs);
                  return (
                    <div
                      key={member}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MemberAvatar
                          member={member}
                          memberConfigs={memberConfigs}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <p className="font-black text-sm truncate">{member}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${themeConfig.badgeBg} ${themeConfig.badgeText}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${themeConfig.bg}`}></span>
                              <span>{themeConfig.color}</span>
                            </span>
                            {themeConfig.photoUrl ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-emerald-500" /> Photo Updated
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">
                                Icon: {themeConfig.emoji}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => exportMemberDataToPDF(member, expenses, memberBankAmounts[member], memberConfigs[member], emis)}
                          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                          title={`Download ${member}'s official PDF statement`}
                        >
                          <Download className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportMemberDataToCSV(member, expenses, memberBankAmounts[member], memberConfigs[member], emis)}
                          className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                          title={`Download ${member}'s CSV data`}
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(member)}
                          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title={`Edit icon or photo for ${member}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInitiateRemove(member)}
                          disabled={familyMembers.length <= 1}
                          className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={familyMembers.length <= 1 ? 'At least 1 member is required' : `Remove ${member}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Member CTA Button */}
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-transform"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add New Family Member</span>
              </button>
            </>
          )}

        </div>

        {/* Confirmation Modal for Removing Member */}
        {memberToRemove && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
            <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                {onOpenChangePinModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberToRemove(null);
                      onOpenChangePinModal();
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>Change PIN?</span>
                  </button>
                )}
              </div>

              <h4 className="text-base font-black">Remove "{memberToRemove}"?</h4>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                To remove this family member, please enter your Admin Security PIN code to confirm deletion.
              </p>

              {/* PIN Code Entry Field */}
              <div className="mt-4 space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Admin PIN Code *</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRemovePin(!showRemovePin)}
                    className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {showRemovePin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showRemovePin ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <input
                  type={showRemovePin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="Enter 4-digit PIN (Default: 1234)"
                  value={removePin}
                  onChange={(e) => {
                    setRemovePin(e.target.value.replace(/[^0-9]/g, ''));
                    setRemovePinError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-center font-mono font-black text-lg tracking-widest border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } ${removePinError ? 'border-rose-500 text-rose-600' : ''}`}
                />
              </div>

              {/* PIN Verification Error Message */}
              {removePinError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{removePinError}</span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMemberToRemove(null);
                    setRemovePin('');
                    setRemovePinError(null);
                  }}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={isSaving || !removePin}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isSaving ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
