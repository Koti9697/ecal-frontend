// In src/components/ui/SkeletonLoader.tsx

interface SkeletonLoaderProps {
  rows?: number;
  cols?: number;
}

export function SkeletonLoader({ rows = 5, cols = 4 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 bg-slate-200 rounded w-full"></div>
          ))}
        </div>
      ))}
    </div>
  );
}