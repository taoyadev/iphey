'use client';

export function SectionLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
