import { createFileRoute } from "@tanstack/react-router";
import { Section, PageHero, Note } from "@/components/site/shared";
import { site } from "@/data/site";

const title = "Privacy Policy | APEX Global Education";
const description =
  "How APEX Global Education handles enquiry information submitted through this website, and how to contact us about your data.";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: Privacy,
});

const sections = [
  {
    heading: "Information we collect",
    body: "When you submit an enquiry or consultation request, we ask for your name, contact details, academic background and study preferences. We collect this to advise you accurately.",
  },
  {
    heading: "How we use it",
    body: "Your information is used to respond to your enquiry, prepare counselling advice and share relevant updates about intakes and deadlines. We do not sell your information.",
  },
  {
    heading: "Sharing with third parties",
    body: "Where you ask us to submit an application, relevant details are shared with the universities you have approved. We do not share your details with institutions without your instruction.",
  },
  {
    heading: "Retention",
    body: "Enquiry records are retained while your study-abroad plan is active and for a reasonable period afterwards, unless you ask us to remove them.",
  },
  {
    heading: "Your choices",
    body: `You can ask to access, correct or delete your information at any time by writing to ${site.email}.`,
  },
];

function Privacy() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Privacy Policy" }]}
        eyebrow="Legal"
        title="Privacy Policy"
        text="A plain-language summary of how enquiry information is handled."
      />
      <Section>
        <div className="mx-auto max-w-3xl">
          {sections.map((s) => (
            <section key={s.heading} className="mt-8 first:mt-0">
              <h2 className="font-display text-xl font-bold">{s.heading}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
          <Note>
            Prototype policy text — replace with a policy reviewed by your legal advisor before
            launch.
          </Note>
        </div>
      </Section>
    </>
  );
}
