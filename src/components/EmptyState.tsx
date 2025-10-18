import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="mb-4 h-12 w-12 rounded-full bg-white flex items-center justify-center text-neutral-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[hsl(var(--color-fg))] mb-2">{title}</h3>
      <p className="text-neutral-500 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
