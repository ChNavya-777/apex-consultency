import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Section, SectionHeader, PageHero, Note } from "@/components/site/shared";
import { ConsultationForm } from "@/components/site/forms";
import { useSession } from "@/lib/portal-auth";
import { site, PROTOTYPE_NOTE } from "@/data/site";

const title = "Book a Free Study Abroad Consultation | APEX Global Education";
const description =
  "Request a free consultation with an APEX counsellor: share your academic background, preferred destination and intake, and get realistic next steps.";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/consultation" },
    ],
    links: [{ rel: "canonical", href: "/consultation" }],
  }),
  component: Consultation,
});

const expect = [
  "A counsellor reviews your academic record and goals before the call.",
  "You get two or three realistic destination and course directions.",
  "We explain indicative costs and funding routes honestly.",
  "You leave with a written next step — no obligation to proceed.",
];

function Consultation() {
  const session = useSession();
  const navigate = useNavigate();

  // Visitors must be signed in as a student before the consultation form is shown.
  useEffect(() => {
    if (session === undefined) return;
    if (session === null || session.role !== "student") {
      void navigate({
        to: "/student/login",
        search: { redirect: "/consultation" },
        replace: true,
      });
    }
  }, [session, navigate]);

  if (session === undefined || session === null || session.role !== "student") {
    return (
      <Section>
        <p className="text-sm text-muted-foreground">Checking your sign-in…</p>
      </Section>
    );
  }

  return (
    <>
      <PageHero
        crumbs={[{ label: "Consultation" }]}
        eyebrow="Free consultation"
        title="Book a Free Consultation"
        text="Tell us where you are in your planning. The more detail you share, the more specific the first conversation can be."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <SectionHeader eyebrow="Your details" title="Consultation Request" />
            <ConsultationForm />
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-bold">What to expect</h2>
              <ul className="mt-4 space-y-3">
                {expect.map((e) => (
                  <li key={e} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-bold">Prefer to call?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Counselling hours are {site.hours[0]?.time} on weekdays.
              </p>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="mt-3 inline-block font-display text-lg font-bold text-brand-blue hover:underline"
              >
                {site.phone}
              </a>
            </div>

            <Note>
              Your details are submitted to our counselling team through a secure workflow.
            </Note>
          </aside>
        </div>
      </Section>
    </>
  );
}
