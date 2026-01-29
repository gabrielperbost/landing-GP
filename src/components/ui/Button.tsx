import clsx from "clsx";
import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  variant?: Variant;
  href?: LinkProps<string>["href"] | string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-soft hover:bg-primaryDark focus-visible:outline-primary",
  secondary:
    "border border-slate-200 bg-white text-ink hover:border-primary hover:text-primary focus-visible:outline-primary",
  ghost: "text-ink hover:text-primary"
};

export const Button = ({ variant = "primary", href, className, children, ...props }: ButtonProps) => {
  if (href) {
    const isExternal = typeof href === "string" && href.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={clsx(baseClasses, variants[variant], className)}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href as LinkProps<string>["href"]}
        className={clsx(baseClasses, variants[variant], className)}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={clsx(baseClasses, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};
