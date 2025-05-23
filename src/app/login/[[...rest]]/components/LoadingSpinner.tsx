import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  size = 'medium',
  message = 'Loading...'
}) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-4',
    large: 'w-16 h-16 border-6'
  };

  const spinnerClass = `${sizeClasses[size]} border-orange-500 border-t-transparent rounded-full animate-spin`;

  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 p-4 md:p-8 items-center justify-center">
        <div className={`${spinnerClass} mb-4`}></div>
        <p className="text-white">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${spinnerClass} mb-2`}></div>
      {message && <p className="text-white text-sm">{message}</p>}
    </div>
  );
};
