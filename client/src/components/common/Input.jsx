import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full rounded-xl text-sm transition-all duration-200
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${isPassword ? 'pr-10' : 'pr-3.5'}
            py-2.5 bg-white dark:bg-slate-900/80
            text-slate-900 dark:text-slate-100
            border ${
              error
                ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500'
            }
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed
            placeholder:text-slate-400 dark:placeholder:text-slate-600
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-500 font-medium mt-1 animate-fadeIn">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default Input;
