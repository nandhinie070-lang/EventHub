import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  const variantStyles = {
    default:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
    accent:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    admin:
      'bg-rose-100/80 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border-rose-300 dark:border-rose-800',
    principal:
      'bg-amber-100/80 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border-amber-300 dark:border-amber-800',
    hod:
      'bg-blue-100/80 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border-blue-300 dark:border-blue-800',
    organizer:
      'bg-purple-100/80 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200 border-purple-300 dark:border-purple-800',
    student:
      'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800'
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    accent: 'bg-purple-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    admin: 'bg-rose-500',
    principal: 'bg-amber-500',
    hod: 'bg-blue-500',
    organizer: 'bg-purple-500',
    student: 'bg-indigo-500'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
