import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, Note } from "@/components/site/shared";
import { UniversityCard } from "@/components/site/cards";
import { universities, universityFilters, UNIVERSITY_DISCLAIMER } from "@/data/universities";

const title = "University Directory — Study Abroad Options | APEX Global Education";
const description =
  "Browse illustrative universities by country, study area and degree level, with programme lists and application overviews for each institution.";

export const Route = createFileRoute("/universities/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/universities" },
    ],
    links: [{ rel: "canonical", href: "/universities" }],
  }),
  component: UniversitiesIndex,
});

const ALL = "All";

function UniversitiesIndex() {
  const [country, setCountry] = useState(ALL);
  const [area, setArea] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [query, setQuery] = useState("");

  const results = useMemo(
    () =>
      universities.filter((u) => {
        const q = query.trim().toLowerCase();
        return (
          (country === ALL || u.country === country) &&
          (area === ALL || u.studyAreas.includes(area)) &&
          (level === ALL || (u.degreeLevels as string[]).includes(level)) &&
          (q === "" ||
            u.name.toLowerCase().includes(q) ||
            u.city.toLowerCase().includes(q) ||
            u.programs.some((p) => p.toLowerCase().includes(q)))
        );
      }),
    [country, area, level, query],
  );

  return (
    <>
      <PageHero
        crumbs={[{ label: "Universities" }]}
        eyebrow="Universities"
        title="Explore Universities Across Our Destinations"
        text="A prototype directory showing the kinds of institutions we help students shortlist, with programmes and application expectations for each."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Get a Personalised Shortlist</Link>
        </Button>
      </PageHero>

      <Section>
        <div className="rounded-lg border border-border bg-card p-5 shadow-soft md:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="University, city or programme"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <Select label="Country" value={country} onChange={setCountry} options={universityFilters.countries} />
            <Select label="Study area" value={area} onChange={setArea} options={universityFilters.studyAreas} />
            <Select
              label="Degree level"
              value={level}
              onChange={setLevel}
              options={universityFilters.degreeLevels as unknown as string[]}
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground" role="status">
            Showing {results.length} of {universities.length} universities
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((u) => (
            <UniversityCard key={u.slug} u={u} />
          ))}
        </div>

        {results.length === 0 && (
          <p className="mt-10 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No universities match these filters. Try widening your search.
          </p>
        )}

        <Note>{UNIVERSITY_DISCLAIMER}</Note>
      </Section>

      <CTASection heading="Want Help Narrowing This Down?" />
    </>
  );
}

function Select({
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
    <label className="block">
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
