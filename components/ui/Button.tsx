import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "amber" | "secondary" | "ghost";

type CommonProps = {
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
  className?: string;
};

type AsLink = CommonProps & { href: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
type AsButton = CommonProps & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", block, children, className, ...rest } = props;
  const classes = ["btn", `btn--${variant}`, block ? "btn--block" : "", className ?? ""].filter(Boolean).join(" ");

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }
  const { href: _href, ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
