import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";
import counselling from "@/assets/counselling.jpg";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, CTASection, StatStrip, Note } from "@/components/site/shared";
import { DynamicIcon } from "@/components/site/icon";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { DestinationFinder } from "@/components/site/DestinationFinder";
import {
  BlogCard,
  DestinationCard,
  SuccessStoryCard,
  TestimonialCard,
  UniversityCard,
} from "@/components/site/cards";
import { site, stats, whyApex, journeySteps } from "@/data/site";
import { destinations } from "@/data/destinations";
import { universities, UNIVERSITY_DISCLAIMER } from "@/data/universities";
import { successStories, testimonials, TESTIMONIAL_NOTE } from "@/data/stories";
import { homeFaqs } from "@/data/faqs";
import { blogPosts } from "@/data/blog";

const title = "APEX Global Education — Study Abroad Consultancy in India";
const description =
  "15+ years of personalised study-abroad guidance: course and career counselling, university shortlisting, applications, visa guidance and pre-departure support.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-mesh relative overflow-hidden text-primary-foreground">
        <div className="container-apex relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="animate-rise">
            <p className="eyebrow text-gold">{site.tagline}</p>
            <h1 className="mt-4 text-[2.15rem] font-bold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              Turn Your Global Ambition Into Reality
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              Personalized guidance for students planning to study abroad — from choosing the right
              course and university to applications, visas, and pre-departure preparation.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link to="/consultation">Book a Free Consultation</Link>
              </Button>
              <Button asChild variant="onDark" size="lg">
                <Link to="/destinations">Explore Destinations</Link>
              </Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-primary-foreground/75">
              {["Counsellor-led, not application-led", "Students and parents guided together", "Ten study destinations"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-gold" aria-hidden="true" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg shadow-lift ring-1 ring-primary-foreground/15">
              <img
                src={heroImage}
                alt="Postgraduate student with a backpack on an international university campus at golden hour"
                width={1600}
                height={1200}
                className="aspect-[4/3] size-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden rounded-lg border border-border bg-card p-5 shadow-lift sm:block">
              <p className="font-display text-2xl font-bold text-gold">15+ years</p>
              <p className="mt-1 max-w-[10rem] text-xs font-medium text-muted-foreground">
                guiding students to postgraduate study abroad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section aria-label="Experience at a glance" className="bg-surface">
        <div className="container-apex -mt-px py-12 md:py-16">
          <StatStrip items={stats} variant="overlap" />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Prototype figures — replace with verified client statistics before launch.
          </p>
        </div>
      </section>

      {/* WHY APEX */}
      <Section>
        <SectionHeader
          eyebrow="Why APEX"
          title="Why Students Choose APEX"
          text="We are counsellors first. Before any form is filled, we make sure the course, the country and the budget genuinely fit the student in front of us — rather than simply processing applications."
          align="center"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {whyApex.map((f) => (
            <article
              key={f.title}
              className="rounded-lg border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-7"
            >
              <span className="grid size-12 place-items-center rounded-md bg-secondary text-brand-blue">
                <DynamicIcon name={f.icon} className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* DESTINATIONS */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Destinations"
          title="Explore Your Study Destinations"
          text="Explore opportunities across some of the world's leading study destinations, with an honest view of costs, intakes and admission expectations."
          action={
            <Button asChild variant="outline">
              <Link to="/destinations">
                View All Destinations
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.slug} d={d} />
          ))}
        </div>
      </Section>

      {/* JOURNEY */}
      <Section>
        <SectionHeader
          eyebrow="How APEX helps"
          title="Your Journey Starts Here"
          text="Seven stages, in order, with a counsellor accountable at each one."
          align="center"
        />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((s) => (
            <li
              key={s.no}
              className="relative rounded-lg border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <span className="font-display text-3xl font-bold text-gold-soft">{s.no}</span>
              <h3 className="mt-3 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
          <li className="flex flex-col justify-center rounded-lg border border-dashed border-gold/50 bg-gold-soft/25 p-6">
            <p className="font-display text-base font-bold">Where are you right now?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Most students join us at stage one or two. It is never too early to talk.
            </p>
            <Button asChild variant="gold" className="mt-4">
              <Link to="/consultation">Start with stage one</Link>
            </Button>
          </li>
        </ol>
      </Section>

      {/* DESTINATION FINDER */}
      <Section tone="surface" id="destination-finder">
        <SectionHeader
          eyebrow="Prototype tool"
          title="Which Destination Could Be Right for You?"
          text="Answer four quick questions for an indicative direction. A counsellor reviews everything properly before any shortlist is made."
          align="center"
        />
        <div className="mx-auto max-w-4xl">
          <DestinationFinder />
        </div>
      </Section>

      {/* UNIVERSITIES */}
      <Section>
        <SectionHeader
          eyebrow="Universities"
          title="Explore Leading Universities"
          text="Illustrative examples of the kinds of institutions we help students shortlist across our destinations."
          action={
            <Button asChild variant="outline">
              <Link to="/universities">
                Explore All Universities
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {universities.slice(0, 6).map((u) => (
            <UniversityCard key={u.slug} u={u} />
          ))}
        </div>
        <Note>{UNIVERSITY_DISCLAIMER}</Note>
      </Section>

      {/* SUCCESS STORIES */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Success stories"
          title="Stories That Inspire"
          text="Journeys from profile evaluation to admission, told through the stages each student went through."
          action={
            <Button asChild variant="outline">
              <Link to="/success-stories">
                View More Success Stories
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {successStories.slice(0, 3).map((s) => (
            <SuccessStoryCard key={s.id} s={s} />
          ))}
        </div>
        <Note>
          Prototype student stories — replace with verified, consented client stories before launch.
        </Note>
      </Section>

      {/* TESTIMONIALS */}
      <Section tone="navy">
        <SectionHeader
          eyebrow="In their words"
          title="What Students and Parents Say"
          text="Honest feedback about the counselling process, without exaggerated claims."
          align="center"
          onDark
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-primary-foreground/55">{TESTIMONIAL_NOTE}</p>
      </Section>

      {/* ABOUT PREVIEW */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-lg shadow-lift">
            <img
              src={counselling}
              alt="An APEX counsellor discussing university options with a student"
              width={1400}
              height={1000}
              loading="lazy"
              className="aspect-[7/5] size-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">About APEX</p>
            <h2 className="gold-rule mt-3 text-3xl font-bold leading-tight md:text-[2.5rem]">
              15+ Years of Helping Students Think Beyond Borders
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              APEX Global Education has spent more than fifteen years sitting across the table from
              students and parents at one of the most important decision points of their lives —
              which course, which university, which country, and at what cost.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              That experience shapes how we work today: patient counselling, realistic shortlists,
              organised applications, careful visa preparation, and support that continues until the
              student has settled in abroad.
            </p>
            <Button asChild variant="default" size="lg" className="mt-8">
              <Link to="/about">
                Discover Our Story
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* RESOURCES */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Resources"
          title="Guidance Worth Reading Before You Apply"
          action={
            <Button asChild variant="outline">
              <Link to="/resources">
                Visit Resource Centre
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-3">
          {blogPosts.slice(0, 3).map((p) => (
            <BlogCard key={p.slug} p={p} />
          ))}
        </div>
      </Section>

      {/* CONSULTATION CTA */}
      <CTASection />

      {/* FAQ PREVIEW */}
      <Section>
        <SectionHeader
          eyebrow="FAQ"
          title="Questions We Hear Most Often"
          align="center"
        />
        <div className="mx-auto max-w-3xl">
          <FAQAccordion items={homeFaqs.filter(Boolean) as { q: string; a: string }[]} idPrefix="home-faq" />
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/faq">
                View All FAQs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
