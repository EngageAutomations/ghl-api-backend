import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function CustomSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  onClick,
}: CustomSwitchProps) {
  const [isChecked, setIsChecked] = useState(checked);
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    }
    
    if (!disabled) {
      const newValue = !isChecked;
      setIsChecked(newValue);
      onCheckedChange(newValue);
    }
  };
  
  return (
    <div
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-300 ease-in-out focus:outline-none",
        isChecked
          ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"
          : "bg-input",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleClick}
      role="switch"
      aria-checked={isChecked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) {
            const newValue = !isChecked;
            setIsChecked(newValue);
            onCheckedChange(newValue);
          }
        }
      }}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-[2px] left-[2px] inline-block h-5 w-5 rounded-full",
          "bg-white shadow-lg transform ring-0",
          "transition-transform duration-300 ease-in-out",
          isChecked 
            ? "translate-x-5 scale-110 shadow-[0_0_5px_rgba(var(--primary-rgb),0.4)]" 
            : "translate-x-0"
        )}
      ></span>
    </div>
  );
}