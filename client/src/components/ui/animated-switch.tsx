import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

const AnimatedSwitch = ({
  checked,
  onCheckedChange,
  onClick,
  className,
  disabled = false,
}: AnimatedSwitchProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    if (!disabled) onCheckedChange(!checked);
  };
  
  return (
    <div 
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        checked ? "bg-primary" : "bg-gray-200",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onClick={handleClick}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) onCheckedChange(!checked);
        }
      }}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md",
          "transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
          checked ? "shadow-[0_0_8px_2px_rgba(var(--primary-rgb),0.4)]" : ""
        )}
      />
    </div>
  );
};

export { AnimatedSwitch };