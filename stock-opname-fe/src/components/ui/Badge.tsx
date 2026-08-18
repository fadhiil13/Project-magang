interface BadgeProps {
  variant?: 'admin' | 'user' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  admin: 'bg-kai-orange text-white',
  user: 'bg-kai-blue text-white',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

export default function Badge({ variant = 'user', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}