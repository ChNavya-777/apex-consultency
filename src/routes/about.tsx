import { createFileRoute, Link } from "@tanstack/react-router";
import founderImg from "@/assets/founder.jpg";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, CTASection, StatStrip, Note } from "@/components/site/shared";
import { stats, timeline, founder, PROTOTYPE_NOTE } from "@/data/site";

const title = "About APEX Global Education — 15+ Years of Study Abroad Guidance";
const description =
  "How APEX Global Education began, how we counsel students, and why families trust our structured, student-first approach to studying abroad.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const approach = [
  { step: "Listen", text: "We start with your story, not a brochure — goals, marks, budget and family expectations." },
  { step: "Understand", text: "We read the profile carefully, including backlogs, gaps and financial limits." },
  { step: "Guide", text: "We explain realistic options and the trade-offs behind each one." },
  { step: "Support", text: "We stay involved through applications, visas and departure." },
];

const parentTrust = [
  { title: "Transparency", text: "Costs, timelines and risks are explained plainly, including what cannot be promised." },
  { title: "Personalised counselling", text: "Advice is built around one student's profile, not a country target." },
  { title: "Structured guidance", text: "Checklists, deadlines and document tracking at every stage." },
  { title: "Open communication", text: "Parents are included in the conversation, not informed afterwards." },
  { title: "Student-first decisions", text: "We will advise against an option when it does not fit." },
];

function About() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "About" }]}
        eyebrow="About APEX"
        title="15+ Years of Experience. One Goal — Your Global Future."
        text="APEX Global Education is a study-abroad consultancy built around counselling. Our work begins long before an application form and continues after a student lands."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Book a Free Consultation</Link>
        </Button>
        <Button asChild variant="onDark" size="lg">
          <Link to="/services">See Our Services</Link>
        </Button>
      </PageHero>

      <Section>
        <StatStrip items={stats} />
        <Note>Prototype figures — replace with verified client statistics before launch.</Note>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader eyebrow="Our story" title="Built one student at a time" />
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                APEX began in 2009 as a small counselling practice in Andhra Pradesh, working with a
                handful of engineering graduates who wanted to pursue a master's degree overseas but
                had no clear way to evaluate their options.
              </p>
              <p>
                Word of mouth from those first families shaped everything that followed. As the
                number of students grew, so did the destinations we supported — first North America,
                then the UK, and later Germany, Ireland and Australia.
              </p>
              <p>
                Today APEX works with students across a range of disciplines, but the method has not
                changed: understand the student properly, then advise.
              </p>
            </div>
            <Note>{PROTOTYPE_NOTE}</Note>
          </div>
          <div>
            <SectionHeader eyebrow="Our approach" title="Listen → Understand → Guide → Support" />
            <ol className="space-y-4">
              {approach.map((a, i) => (
                <li key={a.step} className="rounded-lg border border-border bg-card p-5 shadow-soft">
                  <p className="font-display text-sm font-bold text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold">{a.step}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="For parents"
          title="Why Parents Trust APEX"
          text="Parents carry most of the financial responsibility in a study-abroad decision. We treat them as part of the counselling process."
          align="center"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {parentTrust.map((p) => (
            <article key={p.title} className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="overflow-hidden rounded-lg shadow-lift">
            <img
              src={founderImg}
              alt="Prototype portrait of the APEX founder and lead counsellor"
              width={1000}
              height={1200}
              loading="lazy"
              className="aspect-[5/6] size-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Founder &amp; lead counsellor</p>
            <h2 className="mt-3 text-3xl font-bold md:text-[2.4rem]">{founder.name}</h2>
            <p className="mt-1 text-sm font-semibold text-brand-blue">{founder.role}</p>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{founder.bio}</p>
            <blockquote className="mt-6 border-l-2 border-gold pl-5 font-display text-lg italic leading-relaxed">
              “{founder.quote}”
            </blockquote>
            <ul className="mt-6 space-y-2 text-sm text-foreground/85">
              {founder.credentials.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
            <Note>{PROTOTYPE_NOTE}</Note>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Journey" title="Fifteen Years, Five Milestones" align="center" />
        <ol className="relative mx-auto max-w-3xl border-l border-border pl-6 md:pl-8">
          {timeline.map((t) => (
            <li key={t.year} className="relative pb-9 last:pb-0">
              <span
                className="absolute -left-[1.7rem] top-1 grid size-3 place-items-center rounded-full bg-gold ring-4 ring-background md:-left-[2.2rem]"
                aria-hidden="true"
              />
              <p className="font-display text-sm font-bold text-brand-blue">{t.year}</p>
              <h3 className="mt-1 font-display text-lg font-bold">{t.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
            </li>
          ))}
        </ol>
        <Note>Prototype timeline — replace with verified milestones before launch.</Note>
      </Section>

      <CTASection heading="Want to Hear It in Person?" text="Book a free consultation and meet a counsellor who will walk through your profile with you." />
    </>
  );
}
