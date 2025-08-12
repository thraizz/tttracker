import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const { user, isAnonymous } = useAuth();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (!user || isAnonymous) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center ${className}`}>
        <User className={`${iconSizes[size]} text-gray-500`} />
      </div>
    );
  }

  if (user.photoURL) {
    return (
      <img 
        src={user.photoURL} 
        alt={user.displayName || 'User avatar'}
        className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 ${className}`}
      />
    );
  }

  // Fallback for signed-in users without photo
  const initial = user.displayName?.[0] || user.email?.[0] || 'U';
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 ${className}`}>
      <span className={`font-semibold text-blue-700 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
        {initial.toUpperCase()}
      </span>
    </div>
  );
};