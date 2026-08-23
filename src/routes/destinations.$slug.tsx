import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, Note, Breadcrumbs } from "@/components/site/shared";
import { UniversityCard } from "@/components/site/cards";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { destinations, getDestination } from "@/data/destinations";
import { universities, UNIVERSITY_DISCLAIMER } from "@/data/universities";
import { GENERAL_GUIDANCE_NOTE } from "@/data/site";

export const Route = createFileRoute("/destinations/$slug")({
  loader: ({ params }) => {
    const destination = getDestination(params.slug);
    if (!destination) throw notFound();
    return { destination };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Destination not found — APEX Global Education" }, { name: "robots", content: "noindex" }],
      };
    }
    const d = loaderData.destination;
    const title = `Study in ${d.country} — Courses, Costs & Intakes | APEX`;
    const description = `${d.short} Explore popular courses, admission expectations, intakes, indicative costs and scholarship routes for studying in ${d.country}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/destinations/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/destinations/${params.slug}` }],
    };
  },
  notFoundComponent: DestinationNotFound,
  component: DestinationDetail,
});

function DestinationNotFound() {
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Destinations", to: "/destinations" }, { label: "Not found" }]} />
      <h1 className="mt-6 text-3xl font-bold">We don't cover that destination yet</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        The destination you asked for isn't part of this prototype. Browse the destinations we do cover.
      </p>
      <Button asChild className="mt-6">
        <Link to="/destinations">All destinations</Link>
      </Button>
    </Section>
  );
}

function DestinationDetail() {
  const { destination: d } = Route.useLoaderData();
  const related = universities.filter((u) => u.destinationSlug === d.slug);
  const others = destinations.filter((x) => x.slug !== d.slug).slice(0, 3);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Destinations", to: "/destinations" }, { label: d.country }]}
        eyebrow={d.region}
        title={`Study in ${d.country}`}
        text={d.short}
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Discuss {d.country} With a Counsellor</Link>
        </Button>
      </PageHero>

      <Section>
        <div className="overflow-hidden rounded-lg shadow-lift">
          <img
            src={d.image}
            alt={d.imageAlt}
            width={1600}
            height={900}
            className="aspect-[16/9] size-full object-cover"
          />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-brand-blue">{d.tagline}</p>
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Why here" title={`Why Study in ${d.country}`} />
        <div className="grid gap-6 sm:grid-cols-2">
          {d.whyStudy.map((w) => (
            <article key={w.title} className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-bold">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeader eyebrow="Courses" title="Popular Courses" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.popularCourses.map((c) => (
                <li key={c} className="rounded-md border border-border bg-card px-4 py-3 text-sm">
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <p className="eyebrow">Popular study areas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.popularAreas.map((a) => (
                  <span key={a} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-brand-blue">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Admissions" title="What Admissions Usually Require" />
            <ul className="space-y-3">
              {d.admissionOverview.map((a) => (
                <li key={a} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {a}
                </li>
              ))}
            </ul>
            <Note>{GENERAL_GUIDANCE_NOTE}</Note>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeader eyebrow="Intakes" title="Intake Cycles" />
            <ul className="space-y-4">
              {d.intakes.map((i) => (
                <li key={i.name} className="rounded-lg border border-border bg-card p-5 shadow-soft">
                  <p className="font-display text-base font-bold">{i.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{i.note}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Costs" title="Indicative Costs" />
            <dl className="divide-y divide-border rounded-lg border border-border bg-card">
              {d.costOverview.map((c) => (
                <div key={c.label} className="flex flex-wrap justify-between gap-2 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">{c.label}</dt>
                  <dd className="text-sm font-semibold">{c.value}</dd>
                </div>
              ))}
            </dl>
            <Note>
              Indicative ranges only — costs vary by university, city and intake, and should be
              verified before any financial decision.
            </Note>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeader eyebrow="Funding" title="Scholarship Routes" />
            <ul className="space-y-3">
              {d.scholarships.map((s) => (
                <li key={s} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="After graduation" title="Career Outlook" />
            <p className="text-base leading-relaxed text-muted-foreground">{d.careers}</p>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section tone="surface">
          <SectionHeader
            eyebrow="Universities"
            title={`Example Universities in ${d.country}`}
            action={
              <Button asChild variant="outline">
                <Link to="/universities">All universities</Link>
              </Button>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((u) => (
              <UniversityCard key={u.slug} u={u} />
            ))}
          </div>
          <Note>{UNIVERSITY_DISCLAIMER}</Note>
        </Section>
      )}

      <Section>
        <SectionHeader eyebrow="FAQ" title={`${d.country} — Common Questions`} align="center" />
        <div className="mx-auto max-w-3xl">
          <FAQAccordion items={d.faqs} idPrefix={`${d.slug}-faq`} />
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Compare" title="Other Destinations to Consider" />
        <div className="grid gap-4 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              to="/destinations/$slug"
              params={{ slug: o.slug }}
              className="rounded-lg border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <p className="font-display text-lg font-bold">{o.country}</p>
              <p className="mt-1 text-sm text-muted-foreground">{o.tagline}</p>
            </Link>
          ))}
        </div>
      </Section>

      <CTASection heading={`Thinking About ${d.country}?`} />
    </>
  );
}
