import React from 'react';
import { getMemberTheme, MemberCustomConfig } from '../types';

interface MemberAvatarProps {
  member: string;
  memberConfigs?: Record<string, MemberCustomConfig>;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isActive?: boolean;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  memberConfigs,
  className = '',
  size = 'md',
  isActive = false,
}) => {
  const theme = getMemberTheme(member, memberConfigs);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px] rounded-lg',
    sm: 'w-6 h-6 text-[10px] rounded-lg',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-2xl',
    xl: 'w-14 h-14 text-xl rounded-3xl',
  }[size];

  const dotSizeClasses = {
    xs: 'w-2 h-2 -bottom-0.5 -right-0.5',
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    md: 'w-3 h-3 -bottom-0.5 -right-0.5',
    lg: 'w-3.5 h-3.5 -bottom-1 -right-1',
    xl: 'w-4 h-4 -bottom-1 -right-1',
  }[size];

  const avatarElement = theme.photoUrl ? (
    <img
      src={theme.photoUrl}
      alt={member}
      className={`${sizeClasses} object-cover shrink-0 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 ${className}`}
    />
  ) : (
    <div
      className={`${sizeClasses} flex items-center justify-center font-black shrink-0 transition-transform ${theme.avatarBg} ${className}`}
    >
      {theme.emoji ? theme.emoji : theme.initials}
    </div>
  );

  if (!isActive) {
    return avatarElement;
  }

  return (
    <div className="relative inline-flex shrink-0">
      {avatarElement}
      <span
        className={`absolute ${dotSizeClasses} bg-emerald-500 ring-2 ring-white dark:ring-slate-900 rounded-full shrink-0 shadow-xs z-10`}
        title={`${member} is Active`}
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      </span>
    </div>
  );
};
