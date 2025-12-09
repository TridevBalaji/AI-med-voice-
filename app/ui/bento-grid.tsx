import * as React from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-3 auto-rows-[minmax(6rem,auto)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title: string;
  description: React.ReactNode;
  header: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      <div className="mb-3">{header}</div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold md:text-base">{title}</h3>
          <p className="mt-1 text-xs text-neutral-500 md:text-sm">
            {description}
          </p>
        </div>
        {icon && <div className="shrink-0">{icon}</div>}
      </div>
    </div>
  );
}


