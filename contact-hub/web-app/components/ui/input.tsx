import { cn } from "@/lib/cn";

type InputProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground",
          "placeholder:text-muted/60 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}