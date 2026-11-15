import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline-brand-500",
  outline: "border border-border bg-transparent text-foreground hover:bg-surface-muted focus-visible:outline-brand-500",
};

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}