/**
 * PROTOTYPE DATA — APEX Global Education
 * Every value in src/data/* is illustrative mock content and is designed to be
 * swapped for verified client data (CMS / database) without touching UI code.
 */

export const site = {
  name: "APEX Global Education",
  short: "APEX",
  tagline: "Your Ambition. Our Guidance. A Global Future.",
  description:
    "APEX Global Education is a study-abroad consultancy with 15+ years of experience guiding students through course selection, university applications, visas and pre-departure preparation.",
  phone: "+91 98765 43210",
  email: "hello@apexglobaleducation.example",
  address: "2nd Floor, Sea Breeze Complex, Bhimavaram, Andhra Pradesh 534201, India",
  city: "Bhimavaram, Andhra Pradesh, India",
  hours: [
    { days: "Monday – Friday", time: "9:30 AM – 6:30 PM" },
    { days: "Saturday", time: "10:00 AM – 4:00 PM" },
    { days: "Sunday", time: "By appointment" },
  ],
  socials: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
  ],
} as const;

export const PROTOTYPE_NOTE =
  "Prototype content — replace with verified client information before launch.";

export const GENERAL_GUIDANCE_NOTE =
  "General guidance — requirements and costs should be verified for the relevant intake.";

export const stats = [
  { value: "15+", label: "Years of Experience" },
  { value: "5,000+", label: "Students Guided" },
  { value: "10+", label: "Study Destinations" },
  { value: "500+", label: "University Applications" },
] as const;

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Destinations", to: "/destinations" },
  { label: "Services", to: "/services" },
  { label: "Universities", to: "/universities" },
  { label: "Success Stories", to: "/success-stories" },
  { label: "Resources", to: "/resources" },
  { label: "Contact", to: "/contact" },
] as const;

export const whyApex = [
  {
    icon: "UserRound",
    title: "Personalized Counselling",
    text: "Guidance based on your academic profile, career goals, budget and personal preferences.",
  },
  {
    icon: "Compass",
    title: "Course & Career Guidance",
    text: "Understand suitable courses and realistic career paths before you apply anywhere.",
  },
  {
    icon: "ListChecks",
    title: "University Shortlisting",
    text: "Identify universities that genuinely align with your profile, goals and budget.",
  },
  {
    icon: "FileText",
    title: "Application Assistance",
    text: "Structured support through application preparation, documents and submission.",
  },
  {
    icon: "Plane",
    title: "Visa Guidance",
    text: "Help preparing documentation and understanding each step of the visa process.",
  },
  {
    icon: "Luggage",
    title: "Pre-Departure Support",
    text: "Practical preparation for accommodation, travel, budgeting and student life abroad.",
  },
] as const;

export const journeySteps = [
  { no: "01", title: "Profile Evaluation", text: "We review academics, exams, budget and goals." },
  { no: "02", title: "Course & Career Guidance", text: "Match the right specialisation to your career direction." },
  { no: "03", title: "University Shortlisting", text: "A balanced list of ambitious and realistic options." },
  { no: "04", title: "Application Assistance", text: "SOPs, LORs, transcripts and submissions, organised." },
  { no: "05", title: "Offer & Admission Guidance", text: "Compare offers and make a confident decision." },
  { no: "06", title: "Visa Guidance", text: "Documentation checklists and interview preparation." },
  { no: "07", title: "Pre-Departure Support", text: "Travel, accommodation and settling-in preparation." },
] as const;

export const timeline = [
  { year: "2009", title: "APEX begins", text: "Started as a small counselling practice supporting a handful of engineering graduates." },
  { year: "2012", title: "A growing student community", text: "Word of mouth from families brought steady growth across the region." },
  { year: "2016", title: "Expanded destination support", text: "Added structured guidance for Germany, Ireland and Australia." },
  { year: "2020", title: "Digital counselling", text: "Introduced online counselling so students could plan from anywhere." },
  { year: "2026", title: "15+ years of guidance", text: "A team of counsellors supporting students across ten destinations." },
] as const;

export const founder = {
  name: "Ravi Chandra Varma",
  role: "Founder & Lead Counsellor",
  bio: "With more than fifteen years in international education advising, Ravi has counselled thousands of students on postgraduate study abroad. He works closely with families to make decisions that are academically sound and financially realistic.",
  quote:
    "A good counsellor does not push a country or a university. They help a student understand their own options clearly.",
  credentials: [
    "15+ years in international education advising",
    "Counselled 5,000+ students and families",
    "Specialises in postgraduate pathways after B.Tech",
  ],
} as const;
