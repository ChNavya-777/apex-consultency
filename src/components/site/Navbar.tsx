import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, GraduationCap, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks, site } from "@/data/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/90 backdrop-blur-md shadow-soft"
          : "border-transparent bg-background",
      )}
    >
      <div className="container-apex">
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-300",
            scrolled ? "h-16" : "h-20",
          )}
        >
          <Link to="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
            <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold tracking-tight">APEX</span>
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Global Education
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "text-brand-blue bg-accent" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:flex"
            >
              <Phone className="size-4" aria-hidden="true" />
              {site.phone}
            </a>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/student/login">Login / Sign Up</Link>
            </Button>
            <Button asChild variant="gold" className="hidden sm:inline-flex">
              <Link to="/demo-call">Book a Demo Call</Link>
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid size-11 place-items-center rounded-md border border-border xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-border bg-background xl:hidden">
          <nav aria-label="Mobile" className="container-apex flex flex-col py-3">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="rounded-md px-3 py-3.5 text-base font-medium text-foreground/85 hover:bg-accent"
                activeProps={{ className: "text-brand-blue bg-accent" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 pb-4">
              <Button asChild variant="outline" size="lg">
                <Link to="/student/login">Login / Sign Up</Link>
              </Button>
              <Button asChild variant="gold" size="lg">
                <Link to="/demo-call">Book a Demo Call</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${site.phone.replace(/\s/g, "")}`}>Call {site.phone}</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
