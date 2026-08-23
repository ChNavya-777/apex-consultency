import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, Note, Breadcrumbs } from "@/components/site/shared";
import { UniversityCard } from "@/components/site/cards";
import { universities, getUniversity, UNIVERSITY_DISCLAIMER } from "@/data/universities";

export const Route = createFileRoute("/universities/$slug")({
  loader: ({ params }) => {
    const university = getUniversity(params.slug);
    if (!university) throw notFound();
    return { university };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "University not found — APEX Global Education" }, { name: "robots", content: "noindex" }],
      };
    }
    const u = loaderData.university;
    const title = `${u.name}, ${u.country} — Programmes & Applications | APEX`;
    const description = `${u.name} in ${u.city}: study areas, programme list and an overview of intakes, tests and documents needed to apply.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/universities/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/universities/${params.slug}` }],
    };
  },
  notFoundComponent: UniversityNotFound,
  component: UniversityDetail,
});

function UniversityNotFound() {
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Universities", to: "/universities" }, { label: "Not found" }]} />
      <h1 className="mt-6 text-3xl font-bold">University not found</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        This institution isn't part of the prototype directory.
      </p>
      <Button asChild className="mt-6">
        <Link to="/universities">Browse the directory</Link>
      </Button>
    </Section>
  );
}

function UniversityDetail() {
  const { university: u } = Route.useLoaderData();
  const similar = universities.filter((x) => x.slug !== u.slug && x.country === u.country).slice(0, 3);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Universities", to: "/universities" }, { label: u.name }]}
        eyebrow={`${u.city} · ${u.founded}`}
        title={u.name}
        text={u.overview}
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Check My Eligibility</Link>
        </Button>
        <Button asChild variant="onDark" size="lg">
          <Link to="/destinations/$slug" params={{ slug: u.destinationSlug }}>
            Study in {u.country}
          </Link>
        </Button>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <div>
            <SectionHeader eyebrow="Programmes" title="Programmes Offered" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {u.programs.map((p) => (
                <li key={p} className="rounded-md border border-border bg-card px-4 py-3 text-sm">
                  {p}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 font-display text-xl font-bold">Why students consider it</h3>
            <ul className="mt-4 space-y-3">
              {u.whyConsider.map((w) => (
                <li key={w} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {w}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{u.campusNote}</p>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-bold">Application overview</h2>
              <dl className="mt-4 space-y-4">
                {u.applicationOverview.map((a) => (
                  <div key={a.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {a.label}
                    </dt>
                    <dd className="mt-1 text-sm">{a.value}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Degree levels
                  </dt>
                  <dd className="mt-1 text-sm">{u.degreeLevels.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Study areas
                  </dt>
                  <dd className="mt-1 text-sm">{u.studyAreas.join(", ")}</dd>
                </div>
              </dl>
              <Button asChild variant="gold" className="mt-6 w-full">
                <Link to="/consultation">Request Guidance</Link>
              </Button>
            </div>
            <Note>{UNIVERSITY_DISCLAIMER}</Note>
          </aside>
        </div>
      </Section>

      {similar.length > 0 && (
        <Section tone="surface">
          <SectionHeader eyebrow="Similar" title={`Other Universities in ${u.country}`} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <UniversityCard key={s.slug} u={s} />
            ))}
          </div>
        </Section>
      )}

      <CTASection heading="Is This University Right for Your Profile?" />
    </>
  );
}
