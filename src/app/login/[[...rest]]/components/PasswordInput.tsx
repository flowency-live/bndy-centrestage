import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  label,
  required = false,
  minLength,
  disabled = false,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1} // Prevent focusing via tab
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
