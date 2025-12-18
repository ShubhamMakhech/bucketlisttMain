import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            'border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin',
            sizeClasses[size]
          )}
        />
        {/* Inner ring */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
            'border-2 border-gray-100 border-b-orange-400 rounded-full animate-spin',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-6 h-6'
          )}
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const LoadingCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-2/3"></div>
      </div>
    </div>
  );
};

export const LoadingGrid: React.FC<{ 
  count?: number; 
  className?: string;
  cardClassName?: string;
}> = ({ 
  count = 4, 
  className,
  cardClassName 
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} className={cardClassName} />
      ))}
    </div>
  );
};