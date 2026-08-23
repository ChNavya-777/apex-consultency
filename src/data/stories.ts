import s1 from "@/assets/student-1.jpg";
import s2 from "@/assets/student-2.jpg";
import s3 from "@/assets/student-3.jpg";
import s4 from "@/assets/student-4.jpg";

/**
 * PROTOTYPE DATA — student names, photos and quotes are illustrative.
 * Replace with verified, consented client testimonials before launch.
 */
export type SuccessStory = {
  id: string;
  name: string;
  background: string;
  degree: "B.Tech" | "B.Sc" | "BBA";
  destination: string;
  destinationSlug: string;
  university: string;
  program: string;
  image: string;
  journey: string[];
  testimonial: string;
  year: string;
};

export const successStories: SuccessStory[] = [
  {
    id: "rahul",
    name: "Rahul",
    background: "B.Tech Computer Science",
    degree: "B.Tech",
    destination: "USA",
    destinationSlug: "usa",
    university: "Western Pacific University",
    program: "MS in Computer Science",
    image: s1,
    journey: ["Profile evaluation", "University selection", "Application", "Offer"],
    testimonial:
      "I had shortlisted eleven universities from the internet before I walked in. The counselling session cut that down to five that actually matched my CGPA and budget, and each one was explained to me.",
    year: "2025 intake",
  },
  {
    id: "sneha",
    name: "Sneha",
    background: "B.Tech Electronics & Communication",
    degree: "B.Tech",
    destination: "Germany",
    destinationSlug: "germany",
    university: "Rhine Valley University",
    program: "MS in Embedded Systems",
    image: s2,
    journey: ["Profile evaluation", "Course guidance", "Documentation", "Visa preparation"],
    testimonial:
      "Germany looked complicated because of APS and the blocked account. Having a checklist and someone reviewing every document made the process manageable.",
    year: "2025 intake",
  },
  {
    id: "arjun",
    name: "Arjun",
    background: "B.Tech Mechanical Engineering",
    degree: "B.Tech",
    destination: "United Kingdom",
    destinationSlug: "uk",
    university: "Northbridge University",
    program: "MSc Advanced Engineering",
    image: s3,
    journey: ["Profile evaluation", "Shortlisting", "SOP review", "Offer"],
    testimonial:
      "My parents had more questions than I did. The counsellor sat with them for an hour and answered everything about costs and safety without overselling anything.",
    year: "2024 intake",
  },
  {
    id: "keerthi",
    name: "Keerthi",
    background: "B.Tech Information Technology",
    degree: "B.Tech",
    destination: "Canada",
    destinationSlug: "canada",
    university: "Maplecrest University",
    program: "Master of Data Analytics",
    image: s4,
    journey: ["Profile evaluation", "Course comparison", "Application", "Pre-departure briefing"],
    testimonial:
      "I was unsure between a diploma and a master's. They compared both against my marks and my budget instead of pushing the more expensive option.",
    year: "2025 intake",
  },
  {
    id: "vikram",
    name: "Vikram",
    background: "B.Tech Civil Engineering",
    degree: "B.Tech",
    destination: "Australia",
    destinationSlug: "australia",
    university: "Southern Cross Institute",
    program: "Master of Construction Management",
    image: s1,
    journey: ["Profile evaluation", "Shortlisting", "Application", "Visa preparation"],
    testimonial:
      "I had a two-year work gap and expected it to be a problem. It was addressed properly in my statement of purpose rather than hidden.",
    year: "2024 intake",
  },
  {
    id: "divya",
    name: "Divya",
    background: "B.Sc Chemistry",
    degree: "B.Sc",
    destination: "Ireland",
    destinationSlug: "ireland",
    university: "Emerald Coast University",
    program: "MSc Pharmaceutical Sciences",
    image: s2,
    journey: ["Profile evaluation", "Course guidance", "Scholarship applications", "Offer"],
    testimonial:
      "The scholarship applications were the part I would have skipped on my own. Being reminded of every deadline made a real difference.",
    year: "2025 intake",
  },
];

export const storyFilters = {
  countries: [...new Set(successStories.map((s) => s.destination))],
  courses: [...new Set(successStories.map((s) => s.program))],
  degrees: [...new Set(successStories.map((s) => s.degree))],
};

export type Testimonial = {
  id: string;
  name: string;
  background: string;
  destination: string;
  university: string;
  quote: string;
  image: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Rahul",
    background: "B.Tech CSE, 2024 graduate",
    destination: "USA",
    university: "Western Pacific University",
    quote:
      "What I valued most was being told clearly which universities were not realistic for my profile. That saved me application fees and a lot of anxiety.",
    image: s1,
  },
  {
    id: "t2",
    name: "Sneha",
    background: "B.Tech ECE, 2023 graduate",
    destination: "Germany",
    university: "Rhine Valley University",
    quote:
      "Every document was checked before submission. When my visa appointment came up, nothing was missing from my file.",
    image: s2,
  },
  {
    id: "t3",
    name: "Arjun",
    background: "B.Tech Mechanical, 2023 graduate",
    destination: "United Kingdom",
    university: "Northbridge University",
    quote:
      "I could message my counsellor with small doubts for months. That continuity mattered more than any brochure.",
    image: s3,
  },
  {
    id: "t4",
    name: "Keerthi",
    background: "B.Tech IT, 2024 graduate",
    destination: "Canada",
    university: "Maplecrest University",
    quote:
      "They were honest that no one can promise a visa outcome. They focused on preparing my application as well as it could be prepared.",
    image: s4,
  },
];

export const TESTIMONIAL_NOTE =
  "Prototype testimonials — replace with verified client testimonials before launch.";
