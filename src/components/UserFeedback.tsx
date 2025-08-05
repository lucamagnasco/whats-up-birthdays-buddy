import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, X, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoDismiss?: boolean;
  dismissAfter?: number;
}

interface UserFeedbackProps {
  messages: FeedbackMessage[];
  onDismiss: (id: string) => void;
  className?: string;
}

export const UserFeedback: React.FC<UserFeedbackProps> = ({ 
  messages, 
  onDismiss, 
  className = '' 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {messages.map((message) => (
        <FeedbackMessage key={message.id} message={message} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

interface FeedbackMessageProps {
  message: FeedbackMessage;
  onDismiss: (id: string) => void;
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message.autoDismiss && message.dismissAfter) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(message.id), 300); // Allow animation to complete
      }, message.dismissAfter);

      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(message.id), 300);
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getVariant = () => {
    switch (message.type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className={cn(
      'transition-all duration-300 ease-in-out',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    )}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle>{message.title}</AlertTitle>
          {message.description && (
            <AlertDescription>{message.description}</AlertDescription>
          )}
          {message.action && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto font-normal text-primary"
              onClick={message.action.onClick}
            >
              {message.action.label}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
};

interface SuccessCardProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
  icon?: React.ReactNode;
  className?: string;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({
  title,
  description,
  actions = [],
  icon = <CheckCircle className="w-8 h-8 text-green-600" />,
  className = ''
}) => (
  <Card className={cn('border-green-200 bg-green-50/50', className)}>
    <CardHeader className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <CardTitle className="text-green-800">{title}</CardTitle>
      {description && (
        <CardDescription className="text-green-700">{description}</CardDescription>
      )}
    </CardHeader>
    {actions.length > 0 && (
      <CardContent>
        <div className="flex flex-col gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    )}
  </Card>
);

interface ErrorCardProps {
  title: string;
  description?: string;
  error?: Error;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  }>;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title,
  description,
  error,
  actions = [],
  className = ''
}) => (
  <Card className={cn('border-red-200 bg-red-50/50', className)}>
    <CardHeader className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <CardTitle className="text-red-800">{title}</CardTitle>
      {description && (
        <CardDescription className="text-red-700">{description}</CardDescription>
      )}
    </CardHeader>
    {error && process.env.NODE_ENV === 'development' && (
      <CardContent>
        <details className="text-left">
          <summary className="cursor-pointer text-sm font-medium text-red-700">
            Error Details (Development)
          </summary>
          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32 text-red-800">
            {error.stack}
          </pre>
        </details>
      </CardContent>
    )}
    {actions.length > 0 && (
      <CardContent>
        <div className="flex flex-col gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    )}
  </Card>
);

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className = '' }) => {
  const getVariant = () => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      case 'pending':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {children}
    </Badge>
  );
}; 