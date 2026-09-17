import React from 'react';

export default function Badge({
  children,
  variant = 'neutral', // 'critical' | 'warning' | 'info' | 'success' | 'neutral'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = ''
}) {
  const variantStyles = {
    critical: 'bg-red-50 text-red-700 border-red-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const dotColors = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    neutral: 'bg-slate-400'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border tracking-tight transition-colors ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || dotColors.neutral
          } ${variant === 'critical' ? 'animate-pulse' : ''}`}
        />
      )}
      {children}
    </span>
  );
}
