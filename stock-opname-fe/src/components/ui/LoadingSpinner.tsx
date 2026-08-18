import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ message, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 text-kai-navy animate-spin" />
      {message && <p className="mt-3 text-sm text-kai-gray-500">{message}</p>}
    </div>
  );
}