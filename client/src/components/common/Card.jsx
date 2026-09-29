import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glass = false,
  onClick,
  ...props
}) => {
  const baseCard = glass
    ? 'glass dark:glass-dark'
    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft';

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`rounded-2xl transition-shadow ${baseCard} ${
        hoverEffect ? 'hover:shadow-soft-lg cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3
    className={`text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight ${className}`}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-3 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div
    className={`p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between ${className}`}
  >
    {children}
  </div>
);

export default Card;
