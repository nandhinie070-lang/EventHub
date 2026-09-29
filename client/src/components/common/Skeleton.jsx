import React from 'react';

const Skeleton = ({ className = '', variant = 'text' }) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'h-48 w-full rounded-2xl'
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${
        variantStyles[variant] || ''
      } ${className}`}
    />
  );
};

export default Skeleton;
