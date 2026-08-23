/** PROTOTYPE DATA — service descriptions, replace copy with client-approved text. */
export type Service = {
  slug: string;
  icon: string;
  title: string;
  summary: string;
  description: string;
  deliverables: string[];
};

export const services: Service[] = [
  {
    slug: "profile-evaluation",
    icon: "ClipboardCheck",
    title: "Profile Evaluation",
    summary: "An honest read of where your profile stands today.",
    description:
      "We review your academic record, test scores, backlogs, gaps, budget and long-term goals to establish a realistic starting point before any application decisions are made.",
    deliverables: [
      "Academic profile summary with strengths and gaps",
      "Realistic destination and university tier indication",
      "Exam and timeline recommendations",
    ],
  },
  {
    slug: "career-course-counselling",
    icon: "Compass",
    title: "Career & Course Counselling",
    summary: "Choose the specialisation before choosing the university.",
    description:
      "Many students pick a country first and a course later. We work the other way around — understanding the career direction you want, then identifying the specialisations that support it.",
    deliverables: [
      "Two to three suitable specialisation directions",
      "Comparison of course structures and outcomes",
      "Guidance on prerequisites you may need to cover",
    ],
  },
  {
    slug: "university-shortlisting",
    icon: "ListChecks",
    title: "University Shortlisting",
    summary: "A balanced list, not a long one.",
    description:
      "We build a shortlist that mixes ambitious, matched and safer options based on your profile, budget and intake, and explain the reasoning behind every university on the list.",
    deliverables: [
      "Shortlist with ambitious / match / safe categories",
      "Fee, location and intake comparison",
      "Deadline calendar for each option",
    ],
  },
  {
    slug: "application-assistance",
    icon: "FileText",
    title: "Application Assistance",
    summary: "Organised, reviewed and submitted on time.",
    description:
      "From statements of purpose to recommendation letters and transcripts, we help structure and review each document, then track submissions against deadlines.",
    deliverables: [
      "SOP and resume structuring and review",
      "LOR guidance for referees",
      "Document checklist and submission tracking",
    ],
  },
  {
    slug: "scholarship-guidance",
    icon: "Award",
    title: "Scholarship Guidance",
    summary: "Identify the funding you are realistically eligible for.",
    description:
      "We help you identify university awards, departmental funding and external scholarships that match your profile, and prepare the supporting material each one requires.",
    deliverables: [
      "List of scholarships relevant to your profile",
      "Application requirements and deadlines",
      "Support with essays and supporting documents",
    ],
  },
  {
    slug: "visa-guidance",
    icon: "Plane",
    title: "Visa Guidance",
    summary: "Understand the process and prepare properly.",
    description:
      "We explain the documentation the relevant authority expects, help you organise financial and academic evidence, and prepare you for any interview stage. Outcomes are always decided by the authorities.",
    deliverables: [
      "Destination-specific documentation checklist",
      "Financial documentation guidance",
      "Interview preparation where applicable",
    ],
  },
  {
    slug: "pre-departure-support",
    icon: "Luggage",
    title: "Pre-Departure Support",
    summary: "Arrive prepared, not overwhelmed.",
    description:
      "Accommodation, forex, insurance, packing, travel and the first weeks on campus — we walk through the practical realities of moving abroad with students and parents together.",
    deliverables: [
      "Pre-departure checklist and briefing session",
      "Accommodation and travel guidance",
      "Advice on budgeting and first-month essentials",
    ],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
