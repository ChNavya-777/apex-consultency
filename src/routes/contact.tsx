import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, PageHero, Note } from "@/components/site/shared";
import { ContactForm } from "@/components/site/forms";
import { site, PROTOTYPE_NOTE } from "@/data/site";

const title = "Contact APEX Global Education — Talk to a Counsellor";
const description =
  "Get in touch with APEX Global Education: office address, phone, email and counselling hours, or send an enquiry and we'll respond with next steps.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Contact" }]}
        eyebrow="Contact"
        title="Talk to APEX"
        text="Send us a short note about where you are in your planning, and a counsellor will get back to you with the next step."
      >
        <Button asChild variant="gold" size="lg">
          <Link to="/consultation">Book a Free Consultation</Link>
        </Button>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <SectionHeader eyebrow="Office" title="Where to Find Us" />
            <ul className="space-y-5">
              <Item icon={<MapPin className="size-5" />} label="Office">
                {site.address}
              </Item>
              <Item icon={<Phone className="size-5" />} label="Phone">
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {site.phone}
                </a>
              </Item>
              <Item icon={<Mail className="size-5" />} label="Email">
                <a href={`mailto:${site.email}`} className="hover:underline">
                  {site.email}
                </a>
              </Item>
              <Item icon={<Clock className="size-5" />} label="Counselling hours">
                <ul className="space-y-1">
                  {site.hours.map((h) => (
                    <li key={h.days}>
                      <span className="font-medium text-foreground">{h.days}:</span> {h.time}
                    </li>
                  ))}
                </ul>
              </Item>
            </ul>

            <div className="mt-8 overflow-hidden rounded-lg border border-border bg-surface p-6">
              <p className="font-display text-base font-bold">Prefer a structured session?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The consultation form collects your academic details in advance, so the first
                conversation is more useful.
              </p>
              <Button asChild variant="blue" className="mt-4">
                <Link to="/consultation">Request a Consultation</Link>
              </Button>
            </div>
            <Note>{PROTOTYPE_NOTE}</Note>
          </div>

          <div>
            <SectionHeader eyebrow="Enquiry" title="Send Us a Message" />
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}

function Item({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-brand-blue">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm leading-relaxed text-foreground/90">{children}</div>
      </div>
    </li>
  );
}
