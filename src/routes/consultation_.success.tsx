import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck2, CheckCircle2, HelpCircle } from "lucide-react";
import { Section } from "@/components/site/shared";
import { Button } from "@/components/ui/button";

const title = "Consultation Booked Successfully | APEX Global Education";
const description =
  "Your consultation has been scheduled with APEX Global Education. Review your counsellor, date and time details.";

type SearchParams = {
  event_type_name: string | undefined;
  event_start_time: string | undefined;
  event_end_time: string | undefined;
  assigned_to: string | undefined;
  assigned_to_email: string | undefined;
  invitee_email: string | undefined;
  invitee_full_name: string | undefined;
  location: string | undefined;
};

const clean = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t || t === "undefined" || t === "null") return undefined;
  return t.slice(0, 200);
};

export const Route = createFileRoute("/consultation_/success")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    event_type_name: clean(search["event_type_name"]),
    event_start_time: clean(search["event_start_time"]),
    event_end_time: clean(search["event_end_time"]),
    assigned_to: clean(search["assigned_to"]),
    assigned_to_email: clean(search["assigned_to_email"]),
    invitee_email: clean(search["invitee_email"]),
    invitee_full_name: clean(search["invitee_full_name"]),
    location: clean(search["location"]),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/consultation/success" }],
  }),
  component: ConsultationSuccess,
});

const ISO = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?$/;

/** Parse an ISO timestamp keeping the offset it was written in (no timezone conversion). */
function parseLocalParts(value?: string) {
  if (!value) return null;
  const m = ISO.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  // Use a UTC date purely for weekday/month naming of the wall-clock values.
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (Number.isNaN(utc.getTime())) return null;
  return { utc, hour, minute };
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatDate(value?: string) {
  const p = parseLocalParts(value);
  return p ? DATE_FMT.format(p.utc) : undefined;
}

function formatTime(value?: string) {
  const p = parseLocalParts(value);
  if (!p) return undefined;
  const suffix = p.hour >= 12 ? "PM" : "AM";
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h12}:${String(p.minute).padStart(2, "0")} ${suffix}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-base font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ConsultationSuccess() {
  const s = Route.useSearch();

  const dateText = formatDate(s.event_start_time);
  const startText = formatTime(s.event_start_time);
  const endText = formatTime(s.event_end_time);
  const timeText = startText && endText ? `${startText} – ${endText}` : startText;

  const hasBooking = Boolean(
    dateText || timeText || s.event_type_name || s.assigned_to || s.invitee_full_name || s.invitee_email,
  );

  if (!hasBooking) {
    return (
      <Section>
        <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-7 text-center shadow-soft sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface text-muted-foreground">
            <HelpCircle className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            Consultation Confirmation
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            We couldn&apos;t find the booking details for this confirmation. If you have just
            completed a booking, please check your email for the Calendly confirmation.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="gold" size="lg">
              <Link to="/consultation">Book a Consultation Again</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">Back to APEX</Link>
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-7 text-center shadow-soft sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-brand-blue">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold leading-tight md:text-3xl">
            Consultation Booked Successfully
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your consultation has been successfully scheduled with APEX Global Education.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2.5 border-b border-border bg-surface px-5 py-4 sm:px-6">
            <CalendarCheck2 className="size-4 text-brand-blue" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-foreground">
              Booking Details
            </h2>
          </div>
          <dl>
            <DetailRow label="Counsellor" value={s.assigned_to ?? "Your APEX counsellor"} />
            {dateText && <DetailRow label="Date" value={dateText} />}
            {timeText && <DetailRow label="Time" value={timeText} />}
            {s.event_type_name && (
              <DetailRow label="Consultation Type" value={s.event_type_name} />
            )}
            {s.invitee_full_name && <DetailRow label="Student" value={s.invitee_full_name} />}
            {s.invitee_email && <DetailRow label="Email" value={s.invitee_email} />}
          </dl>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="gold" size="lg">
            <Link to="/">Back to APEX</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/consultation">Book a Consultation Again</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
