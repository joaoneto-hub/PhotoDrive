import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
}

export function Loading({ className }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
    </div>
  );
}
