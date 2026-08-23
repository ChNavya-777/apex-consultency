import { Link } from "@tanstack/react-router";
import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { site, PROTOTYPE_NOTE } from "@/data/site";

const explore = [
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Destinations", to: "/destinations" },
  { label: "Universities", to: "/universities" },
  { label: "Success Stories", to: "/success-stories" },
] as const;

const resources = [
  { label: "Blog", to: "/resources" },
  { label: "FAQs", to: "/faq" },
  { label: "Consultation", to: "/consultation" },
] as const;

export function Footer() {
  return (
    <footer className="bg-navy-deep text-primary-foreground">
      <div className="container-apex py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-md bg-primary-foreground/10">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold">APEX Global Education</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              {site.tagline} Personalised study-abroad counselling for students planning
              postgraduate education overseas.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={`${s.label} (prototype link)`}
                    className="inline-flex h-9 items-center rounded-md border border-primary-foreground/20 px-3 text-xs font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Explore">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Explore</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {explore.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Resources</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {resources.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-primary-foreground">
                  {site.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:${site.email}`} className="break-all hover:text-primary-foreground">
                  {site.email}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <address className="not-italic">{site.city}</address>
              </li>
            </ul>
            <p className="mt-4 text-xs text-primary-foreground/45">{PROTOTYPE_NOTE}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-apex flex flex-col items-center justify-between gap-3 py-6 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© 2026 APEX Global Education. All rights reserved.</p>
          <ul className="flex gap-6">
            <li>
              <Link to="/privacy-policy" className="hover:text-primary-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary-foreground">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
