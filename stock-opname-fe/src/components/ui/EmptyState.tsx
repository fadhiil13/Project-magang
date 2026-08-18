import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-kai-gray-500 mb-3">
        {icon || <InboxIcon className="w-12 h-12 mx-auto" />}
      </div>
      <h3 className="text-lg font-semibold text-kai-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-kai-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}