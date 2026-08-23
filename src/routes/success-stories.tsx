import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, StatStrip, Note } from "@/components/site/shared";
import { SuccessStoryCard, TestimonialCard } from "@/components/site/cards";
import { successStories, storyFilters, testimonials, TESTIMONIAL_NOTE } from "@/data/stories";
import { stats } from "@/data/site";

const title = "Student Success Stories — Study Abroad Journeys | APEX";
const description =
  "Prototype student journeys from profile evaluation to admission, across the USA, UK, Canada, Germany, Australia and Ireland.";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/success-stories" },
    ],
    links: [{ rel: "canonical", href: "/success-stories" }],
  }),
  component: SuccessStories,
});

const ALL = "All";

function SuccessStories() {
  const [country, setCountry] = useState(ALL);
  const [degree, setDegree] = useState(ALL);

  const results = useMemo(
    () =>
      successStories.filter(
        (s) =>
          (country === ALL || s.destination === country) && (degree === ALL || s.degree === degree),
      ),
    [country, degree],
  );

  return (
    <>
      <PageHero
        crumbs={[{ label: "Success Stories" }]}
        eyebrow="Success stories"
        title="Journeys That Started With a Conversation"
        text="Each story below follows the same stages we use with every student: evaluate the profile, shortlist honestly, apply carefully, prepare for departure."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Start Your Own Journey</Link>
        </Button>
      </PageHero>

      <Section>
        <StatStrip items={stats} />
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Browse" title="Student Journeys" />
        <div className="mb-8 flex flex-wrap gap-4">
          <Filter label="Destination" value={country} onChange={setCountry} options={storyFilters.countries} />
          <Filter label="Degree" value={degree} onChange={setDegree} options={storyFilters.degrees} />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => (
            <SuccessStoryCard key={s.id} s={s} />
          ))}
        </div>
        {results.length === 0 && (
          <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No stories match these filters yet.
          </p>
        )}
        <Note>
          Prototype student stories — replace with verified, consented client stories before launch.
        </Note>
      </Section>

      <Section tone="navy">
        <SectionHeader eyebrow="In their words" title="What Students and Parents Say" align="center" onDark />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-primary-foreground/55">{TESTIMONIAL_NOTE}</p>
      </Section>

      <CTASection heading="Your Story Could Be Next" />
    </>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block min-w-[12rem]">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
