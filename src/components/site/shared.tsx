import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  tone = "default",
  id,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "surface" | "navy";
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "py-16 md:py-24",
        tone === "surface" && "bg-surface",
        tone === "navy" && "bg-navy-deep text-primary-foreground",
        className,
      )}
    >
      <div className="container-apex">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
  onDark = false,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
  onDark?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-14",
        align === "center" && "mx-auto max-w-2xl text-center",
        action && align === "left" && "flex flex-wrap items-end justify-between gap-6",
      )}
    >
      <div className={cn(align === "left" && action && "max-w-2xl")}>
        {eyebrow && (
          <p className={cn("eyebrow", onDark && "text-gold")}>{eyebrow}</p>
        )}
        <h2
          className={cn(
            "mt-3 text-3xl font-bold leading-[1.15] md:text-[2.6rem]",
            onDark ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {text && (
          <p
            className={cn(
              "mt-4 text-base leading-relaxed md:text-[1.05rem]",
              onDark ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            {text}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  children,
  crumbs,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  children?: ReactNode;
  crumbs?: { label: string; to?: string }[];
}) {
  return (
    <section className="hero-mesh text-primary-foreground">
      <div className="container-apex py-14 md:py-20">
        {crumbs && <Breadcrumbs items={crumbs} onDark />}
        <div className="max-w-3xl animate-rise">
          {eyebrow && <p className="eyebrow mt-4 text-gold">{eyebrow}</p>}
          <h1 className="mt-3 text-3xl font-bold leading-[1.12] md:text-5xl">{title}</h1>
          {text && (
            <p className="mt-5 text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              {text}
            </p>
          )}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function Breadcrumbs({
  items,
  onDark = false,
}: {
  items: { label: string; to?: string }[];
  onDark?: boolean;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1 text-xs font-medium",
          onDark ? "text-primary-foreground/60" : "text-muted-foreground",
        )}
      >
        <li>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
            {item.to ? (
              <Link to={item.to} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={onDark ? "text-primary-foreground" : "text-foreground"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CTASection({
  heading = "Not Sure Where to Start?",
  text = "Tell us about your academic background and goals. Our counsellors can help you understand your study-abroad options.",
}: {
  heading?: string;
  text?: string;
}) {
  return (
    <section className="hero-mesh text-primary-foreground">
      <div className="container-apex py-16 text-center md:py-20">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight md:text-[2.6rem]">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/80">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold" size="lg">
            <Link to="/consultation">Book a Free Consultation</Link>
          </Button>
          <Button asChild variant="onDark" size="lg">
            <Link to="/contact">Talk to APEX</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

export function StatStrip({
  items,
  variant = "light",
}: {
  items: readonly { value: string; label: string }[];
  variant?: "light" | "overlap";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4",
        variant === "overlap" && "shadow-lift",
      )}
    >
      {items.map((s) => (
        <div key={s.label} className="bg-card px-5 py-7 text-center sm:px-6 sm:py-9">
          <p className="font-display text-3xl font-bold text-brand-blue md:text-[2.5rem]">
            <span className="text-gold">{s.value}</span>
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-sm sm:tracking-[0.06em]">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
