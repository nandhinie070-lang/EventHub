import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-xl';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5'
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white shadow-soft hover:shadow-glow focus:ring-indigo-500 border border-indigo-500/30',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-slate-400',
    outline:
      'border-2 border-indigo-600/30 dark:border-indigo-400/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 focus:ring-indigo-500',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 focus:ring-slate-400',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-soft focus:ring-rose-500'
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      whileHover={disabled || isLoading ? {} : { scale: 1.015 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.985 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </motion.button>
  );
};

export default Button;
