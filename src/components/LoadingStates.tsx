import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

interface SkeletonGroupCardProps {
  className?: string;
}

export const SkeletonGroupCard: React.FC<SkeletonGroupCardProps> = ({ className = '' }) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface SkeletonMemberCardProps {
  className?: string;
}

export const SkeletonMemberCard: React.FC<SkeletonMemberCardProps> = ({ className = '' }) => (
  <Card className={className}>
    <CardContent className="p-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface LoadingPageProps {
  title?: string;
  description?: string;
  showSpinner?: boolean;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  title = 'Loading...',
  description = 'Please wait while we load your content.',
  showSpinner = true
}) => (
  <div className="min-h-screen bg-gradient-to-br from-celebration/5 to-birthday/5 flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        {showSpinner && <LoadingSpinner size="lg" className="mb-4" />}
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </div>
);

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  text = 'Loading...',
  children 
}) => (
  <div className="relative">
    {children}
    {isVisible && (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingSpinner text={text} />
      </div>
    )}
  </div>
);

interface SkeletonListProps {
  count?: number;
  renderItem: (index: number) => React.ReactNode;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  count = 3, 
  renderItem,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index}>
        {renderItem(index)}
      </div>
    ))}
  </div>
); 