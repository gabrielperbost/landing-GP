import clsx from "clsx";
import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "accent";
};

export const Card = ({ children, className, tone = "default", ...props }: CardProps) => {
  const toneClasses =
    tone === "accent"
      ? "bg-gradient-to-br from-white via-white to-blue-50 border border-blue-100"
      : "bg-white border border-slate-200";

  return (
    <div
      className={clsx(
        "rounded-xl shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        toneClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
