import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { destinations } from "@/data/destinations";
import { PROTOTYPE_NOTE } from "@/data/site";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/portal-auth";


const courseOptions = [
  "MS in Computer Science",
  "MS in Data Science / Analytics",
  "MS in Electrical / Electronics",
  "MS in Mechanical / Automotive",
  "MS in Civil / Construction Management",
  "MSc Artificial Intelligence",
  "Business / Management",
  "Not decided yet",
];

function Field({
  id,
  label,
  required,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectInput({
  id,
  name,
  options,
  placeholder,
  required,
  ariaInvalid,
}: {
  id: string;
  name: string;
  options: string[];
  placeholder: string;
  required?: boolean;
  ariaInvalid?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      aria-invalid={ariaInvalid}
      defaultValue=""
      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function SuccessPanel({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-8 text-center shadow-soft"
      role="status"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-brand-blue">
        <CheckCircle2 className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-display text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/destinations">Explore Destinations</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/resources">Read Resources</Link>
        </Button>
      </div>
    </div>
  );
}

/** APEX Calendly booking page (Session meeting — 1 hour, Round Robin). */
const CALENDLY_BOOKING_URL = "https://calendly.com/d/dvxk-fqs-d9j/session-meeting";

function buildCalendlyUrl(name: string, email: string) {
  const url = new URL(CALENDLY_BOOKING_URL);
  if (name) url.searchParams.set("name", name);
  if (email) url.searchParams.set("email", email);
  return url.toString();
}

function ConsultationSuccessPanel({ name, email }: { name: string; email: string }) {
  const [navError, setNavError] = useState(false);

  const goToCalendly = () => {
    try {
      window.location.assign(buildCalendlyUrl(name, email));
    } catch {
      setNavError(true);
    }
  };

  return (
    <div
      className="rounded-lg border border-border bg-card p-8 text-center shadow-soft"
      role="status"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-brand-blue">
        <CheckCircle2 className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-display text-xl font-bold">Consultation Request Received</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Your details have been submitted successfully. Choose a convenient time to speak with our
        counsellor.
      </p>
      {navError && (
        <div className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-left text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Unable to open the scheduling page. Please try again.</span>
        </div>
      )}
      <div className="mt-6">
        <Button variant="gold" size="lg" onClick={goToCalendly}>
          {navError ? "Try Again" : "Book a Session"}
        </Button>
      </div>
    </div>
  );
}

type Errors = Record<string, string>;

function validate(data: FormData, required: string[]): Errors {
  const errors: Errors = {};
  for (const key of required) {
    const value = String(data.get(key) ?? "").trim();
    if (!value) {
      errors[key] = "This field is required.";
      continue;
    }
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      errors[key] = "Enter a valid email address.";
    }
    if (key === "phone" && value.replace(/\D/g, "").length < 8) {
      errors[key] = "Enter a valid phone number.";
    }
  }
  return errors;
}

const countryOptions = destinations.map((d) => d.country).concat("Not decided yet");

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  if (state === "done") {
    return (
      <SuccessPanel
        title="Thank you — your enquiry has been received."
        text="An APEX counsellor will get in touch with you shortly to schedule a convenient time."
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const found = validate(data, ["name", "phone", "email", "message"]);
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        setState("loading");
        window.setTimeout(() => setState("done"), 900);
      }}
      className="rounded-lg border border-border bg-card p-6 shadow-soft md:p-8"
    >
      <h2 className="font-display text-xl font-bold">Send us an enquiry</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Fields marked with an asterisk are required.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors["name"]}>
          <Input id="name" name="name" autoComplete="name" aria-invalid={!!errors["name"]} />
        </Field>
        <Field id="phone" label="Phone number" required error={errors["phone"]}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors["phone"]}
          />
        </Field>
        <Field id="email" label="Email" required error={errors["email"]} className="sm:col-span-2">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors["email"]}
          />
        </Field>
        <Field id="country" label="Interested country">
          <SelectInput
            id="country"
            name="country"
            options={countryOptions}
            placeholder="Select a country"
          />
        </Field>
        <Field id="course" label="Preferred course">
          <SelectInput
            id="course"
            name="course"
            options={courseOptions}
            placeholder="Select a course"
          />
        </Field>
        <Field
          id="message"
          label="Message"
          required
          error={errors["message"]}
          className="sm:col-span-2"
        >
          <Textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Tell us briefly about your academic background and what you would like to discuss."
            aria-invalid={!!errors["message"]}
          />
        </Field>
      </div>

      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="mt-7 w-full"
        disabled={state === "loading"}
      >
        {state === "loading" && <Loader2 className="size-4 animate-spin" />}
        {state === "loading" ? "Sending…" : "Send Enquiry"}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">{PROTOTYPE_NOTE}</p>
    </form>
  );
}

export function ConsultationForm() {
  // When a student is signed in, the account email is the form email — it cannot be edited.
  const session = useSession();
  const studentEmail = session?.role === "student" ? session.email : "";
  const studentName = session?.role === "student" ? session.name : "";
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booked, setBooked] = useState({ name: "", email: "" });

  if (state === "done") {
    return <ConsultationSuccessPanel name={booked.name} email={booked.email} />;
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const found = validate(data, ["fullName", "phone", "email", "degree", "country", "intake"]);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSubmitError(null);
        setState("loading");

        const payload = {
          fullName: String(data.get("fullName") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          email: (studentEmail || String(data.get("email") ?? "")).trim().toLowerCase(),
          degree: String(data.get("degree") ?? "").trim(),
          branch: String(data.get("branch") ?? "").trim(),
          graduationYear: String(data.get("graduationYear") ?? "").trim(),
          cgpa: String(data.get("cgpa") ?? "").trim(),
          country: String(data.get("country") ?? "").trim(),
          course: String(data.get("course") ?? "").trim(),
          intake: String(data.get("intake") ?? "").trim(),
          englishTest: String(data.get("englishTest") ?? "").trim(),
          budget: String(data.get("budget") ?? "").trim(),
          message: String(data.get("message") ?? "").trim(),
        };

        try {
          const res = await fetch("/api/consultation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = (await res.json().catch(() => ({ success: false }))) as {
            success?: boolean;
            message?: string;
          };

          if (!res.ok || result.success !== true) {
            throw new Error(result.message || "Submission failed. Please try again.");
          }

          setBooked({ name: payload.fullName, email: payload.email });
          setState("done");
        } catch (err) {
          setState("idle");
          setSubmitError(err instanceof Error ? err.message : "Network error. Please try again.");
        }
      }}
      className="rounded-lg border border-border bg-card p-6 shadow-soft md:p-8"
    >
      <h2 className="font-display text-xl font-bold">Consultation request</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The more you share, the more specific our first conversation can be. Required fields are
        marked with an asterisk.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label="Full name" required error={errors["fullName"]}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            defaultValue={studentName}
            aria-invalid={!!errors["fullName"]}
          />
        </Field>
        <Field id="phone" label="Phone number" required error={errors["phone"]}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors["phone"]}
          />
        </Field>
        <Field id="email" label="Email" required error={errors["email"]} className="sm:col-span-2">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors["email"]}
            {...(studentEmail
              ? { value: studentEmail, readOnly: true, className: "bg-surface/60" }
              : {})}
          />
          {studentEmail && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your account email is used for this request.
            </p>
          )}
        </Field>
        <Field id="degree" label="Current degree" required error={errors["degree"]}>
          <SelectInput
            id="degree"
            name="degree"
            required
            options={["B.Tech / B.E.", "B.Sc", "B.Com / BBA", "Diploma", "Other"]}
            placeholder="Select your degree"
            ariaInvalid={!!errors["degree"]}
          />
        </Field>
        <Field id="branch" label="Branch / specialisation">
          <Input id="branch" name="branch" placeholder="e.g. Computer Science" />
        </Field>
        <Field id="graduationYear" label="Graduation year">
          <Input
            id="graduationYear"
            name="graduationYear"
            inputMode="numeric"
            placeholder="e.g. 2026"
          />
        </Field>
        <Field id="cgpa" label="CGPA / percentage">
          <Input id="cgpa" name="cgpa" placeholder="e.g. 7.8 or 72%" />
        </Field>
        <Field id="country" label="Preferred country" required error={errors["country"]}>
          <SelectInput
            id="country"
            name="country"
            required
            options={countryOptions}
            placeholder="Select a country"
            ariaInvalid={!!errors["country"]}
          />
        </Field>
        <Field id="course" label="Preferred course">
          <SelectInput
            id="course"
            name="course"
            options={courseOptions}
            placeholder="Select a course"
          />
        </Field>
        <Field id="intake" label="Preferred intake" required error={errors["intake"]}>
          <SelectInput
            id="intake"
            name="intake"
            required
            options={[
              "Fall / September 2026",
              "January 2027",
              "Fall / September 2027",
              "Not decided yet",
            ]}
            placeholder="Select an intake"
            ariaInvalid={!!errors["intake"]}
          />
        </Field>
        <Field id="englishTest" label="IELTS / PTE status">
          <SelectInput
            id="englishTest"
            name="englishTest"
            options={[
              "Not booked yet",
              "Booked, not taken",
              "Taken — awaiting result",
              "Score available",
            ]}
            placeholder="Select status"
          />
        </Field>
        <Field id="budget" label="Budget range (per year)" className="sm:col-span-2">
          <SelectInput
            id="budget"
            name="budget"
            options={[
              "Under ₹15 lakh",
              "₹15 – 25 lakh",
              "₹25 – 40 lakh",
              "Above ₹40 lakh",
              "Need guidance on budget",
            ]}
            placeholder="Select a range"
          />
        </Field>
        <Field id="message" label="Anything else we should know?" className="sm:col-span-2">
          <Textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Backlogs, study gaps, work experience, family preferences — anything relevant."
          />
        </Field>
      </div>

      {submitError && (
        <div className="mt-5 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="mt-7 w-full"
        disabled={state === "loading"}
      >
        {state === "loading" && <Loader2 className="size-4 animate-spin" />}
        {state === "loading" ? "Submitting…" : "Request Free Consultation"}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Your details are submitted to our counselling team via a secure workflow.
      </p>
    </form>
  );
}
