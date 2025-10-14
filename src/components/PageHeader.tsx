import { ReactNode } from "react";
import BackButton from "@/components/BackButton";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  showBackButton = true,
  backHref,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {showBackButton && <BackButton href={backHref} />}
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--color-fg))]">{title}</h1>
          {description && (
            <p className="text-neutral-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
