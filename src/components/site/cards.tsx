import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Clock, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/site/icon";
import type { Destination } from "@/data/destinations";
import type { University } from "@/data/universities";
import type { Service } from "@/data/services";
import type { SuccessStory, Testimonial } from "@/data/stories";
import type { BlogPost } from "@/data/blog";

export function DestinationCard({ d }: { d: Destination }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={d.image}
          alt={d.imageAlt}
          width={1200}
          height={800}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-md bg-navy-deep/85 px-2.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
          {d.region}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold">{d.country}</h3>
        <p className="mt-1 text-sm font-medium text-brand-blue">{d.tagline}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.short}</p>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Popular study areas
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {d.popularAreas.slice(0, 3).map((a) => (
              <li
                key={a}
                className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex-1" />
        <Button asChild variant="outline" className="w-full justify-between">
          <Link to="/destinations/$slug" params={{ slug: d.slug }}>
            Explore Destination
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function ServiceCard({ s, index }: { s: Service; index?: number }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-brand-blue">
          <DynamicIcon name={s.icon} className="size-5" />
        </span>
        {index !== undefined && (
          <span className="font-display text-sm font-bold text-gold">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
      <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
      <ul className="mt-4 space-y-2 text-sm text-foreground/85">
        {s.deliverables.map((d) => (
          <li key={d} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>
      <div className="flex-1" />
      <Button asChild variant="link" className="mt-5 h-auto justify-start p-0">
        <Link to="/consultation">
          Discuss this service
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </article>
  );
}

export function UniversityCard({ u }: { u: University }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold leading-snug">{u.name}</h3>
        <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
          {u.country}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden="true" />
        {u.city}
      </p>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Study areas
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {u.studyAreas.map((a) => (
            <li key={a} className="rounded-md bg-surface px-2.5 py-1 text-xs font-medium">
              {a}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Example programmes
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
          {u.programs.slice(0, 3).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div className="flex-1" />
      <Button asChild variant="outline" className="mt-6 w-full justify-between">
        <Link to="/universities/$slug" params={{ slug: u.slug }}>
          View University
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </article>
  );
}

export function SuccessStoryCard({ s }: { s: SuccessStory }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-center gap-4 border-b border-border p-6">
        <img
          src={s.image}
          alt={`${s.name}, prototype student portrait`}
          width={640}
          height={640}
          loading="lazy"
          className="size-16 rounded-full object-cover"
        />
        <div>
          <h3 className="font-display text-lg font-bold">{s.name}</h3>
          <p className="text-sm text-muted-foreground">{s.background}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Destination
            </dt>
            <dd className="mt-1 font-medium">{s.destination}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Intake
            </dt>
            <dd className="mt-1 font-medium">{s.year}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Programme
            </dt>
            <dd className="mt-1 font-medium">{s.program}</dd>
            <dd className="text-sm text-muted-foreground">{s.university}</dd>
          </div>
        </dl>
        <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {s.journey.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-md bg-surface px-2 py-1 font-medium text-foreground/80">
                {step}
              </span>
              {i < s.journey.length - 1 && <span aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
        <blockquote className="mt-5 border-l-2 border-gold pl-4 text-sm italic leading-relaxed text-foreground/85">
          {s.testimonial}
        </blockquote>
      </div>
    </article>
  );
}

export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-lg border border-primary-foreground/12 bg-primary-foreground/6 p-6 backdrop-blur md:p-7">
      <Quote className="size-7 text-gold" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-primary-foreground/90">
        {t.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-primary-foreground/12 pt-5">
        <img
          src={t.image}
          alt={`${t.name}, prototype student portrait`}
          width={640}
          height={640}
          loading="lazy"
          className="size-11 rounded-full object-cover"
        />
        <div className="text-sm">
          <p className="font-semibold text-primary-foreground">{t.name}</p>
          <p className="text-primary-foreground/65">
            {t.background} · {t.destination}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function BlogCard({ p }: { p: BlogPost }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to="/resources/$slug"
        params={{ slug: p.slug }}
        className="aspect-[16/9] overflow-hidden"
        aria-label={p.title}
      >
        <img
          src={p.image}
          alt={p.imageAlt}
          width={1200}
          height={800}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-md bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
            {p.category}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {p.readingTime}
          </span>
        </div>
        <h3 className="mt-4 font-display text-lg font-bold leading-snug">
          <Link to="/resources/$slug" params={{ slug: p.slug }} className="hover:text-brand-blue">
            {p.title}
          </Link>
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
        <div className="flex-1" />
        <p className="mt-5 text-xs text-muted-foreground">{p.displayDate}</p>
      </div>
    </article>
  );
}
