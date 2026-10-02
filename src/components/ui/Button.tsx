import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "confirmed";

interface Common {
  variant?: Variant;
  size?: "md" | "sm";
  block?: boolean;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

function classes({ variant = "primary", size = "md", block, className }: Omit<Common, "children" | "icon">) {
  return ["sl-btn", `sl-btn-${variant}`, size === "sm" && "sl-btn-sm", block && "sl-btn-block", className]
    .filter(Boolean)
    .join(" ");
}

export function Button({ variant, size, block, icon, children, className, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button type="button" className={classes({ variant, size, block, className })} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  icon,
  children,
  className,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={classes({ variant, size, block, className })} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}
