import { cn } from "../lib/utils";

export interface StepperStep {
  label: string;
  subtitle?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
  className?: string;
  variant?: "default" | "marketing";
}

export function Stepper({
  steps,
  currentIndex,
  className,
  variant = "default",
}: StepperProps) {
  const activeStep = steps[currentIndex];

  return (
    <nav aria-label="Progresso do formulário" className={className}>
      <ol className="flex flex-wrap gap-2 text-xs">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <li
              key={step.label}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 transition-colors",
                variant === "marketing" && isCurrent && "border-marketing-accent text-marketing-accent",
                variant === "marketing" &&
                  isComplete &&
                  "border-emerald-500/40 text-emerald-300",
                variant === "marketing" &&
                  !isCurrent &&
                  !isComplete &&
                  "border-white/10 text-zinc-400",
                variant === "default" && isCurrent && "border-primary text-primary",
                variant === "default" && isComplete && "border-emerald-500/40 text-emerald-600 dark:text-emerald-300",
                variant === "default" &&
                  !isCurrent &&
                  !isComplete &&
                  "border-border text-muted-foreground",
              )}
            >
              {index + 1}. {step.label}
            </li>
          );
        })}
      </ol>
      {activeStep?.subtitle ? (
        <p
          className={cn(
            "mt-2 text-sm",
            variant === "marketing" ? "text-zinc-400" : "text-muted-foreground",
          )}
        >
          {activeStep.subtitle}
        </p>
      ) : null}
    </nav>
  );
}
