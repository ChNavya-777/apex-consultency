import usa from "@/assets/dest-usa.jpg";
import uk from "@/assets/dest-uk.jpg";
import canada from "@/assets/dest-canada.jpg";
import germany from "@/assets/dest-germany.jpg";
import australia from "@/assets/dest-australia.jpg";
import ireland from "@/assets/dest-ireland.jpg";
import counselling from "@/assets/counselling.jpg";
import hero from "@/assets/hero-students.jpg";

/** PROTOTYPE DATA — illustrative articles written for this prototype. */
export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  displayDate: string;
  readingTime: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  body: { heading?: string; paragraphs: string[]; bullets?: string[] }[];
};

export const blogCategories = [
  "Study Abroad",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "IELTS / PTE",
  "Applications",
  "Visa Guidance",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "start-planning-study-abroad-after-btech",
    title: "How to Start Planning Your Study Abroad Journey After B.Tech",
    category: "Study Abroad",
    date: "2026-07-18",
    displayDate: "18 July 2026",
    readingTime: "7 min read",
    image: counselling,
    imageAlt: "Counsellor and student reviewing university options on a laptop",
    excerpt:
      "The first three months of planning decide how smooth the rest of the process feels. Here is a practical starting sequence for engineering graduates.",
    body: [
      {
        paragraphs: [
          "Most students begin with a country. That is usually the wrong first step. A destination is the outcome of your academic profile, budget and career direction — not the starting point.",
          "This guide sets out a sequence you can follow in your final year or in the months after graduation.",
        ],
      },
      {
        heading: "1. Take stock of your profile honestly",
        paragraphs: [
          "Collect your semester-wise marks, note any backlogs, and list projects, internships and certifications. This is the raw material every university decision is built on.",
        ],
      },
      {
        heading: "2. Decide the specialisation before the university",
        paragraphs: [
          "A B.Tech in ECE can lead to embedded systems, VLSI, data engineering or telecommunications. These are very different careers. Narrow the direction first.",
        ],
      },
      {
        heading: "3. Set a realistic budget with your family",
        paragraphs: [
          "Discuss tuition, living costs, travel and one-time expenses together, including how much may come from a loan. A clear budget removes most unrealistic options immediately.",
        ],
      },
      {
        heading: "4. Book your English test early",
        paragraphs: [
          "IELTS or PTE slots fill quickly around peak intakes. Booking early gives you room for a retake if needed.",
        ],
      },
      {
        heading: "5. Build a timeline backwards from the intake",
        paragraphs: [
          "Work backwards from your target intake through visa preparation, offers, applications, documents and exams. Anything that does not fit signals that the next intake may suit you better.",
        ],
        bullets: [
          "10–12 months before: profile review and exam booking",
          "8 months before: shortlist and document preparation",
          "6 months before: applications submitted",
          "3 months before: offers, funding and visa documentation",
        ],
      },
    ],
  },
  {
    slug: "ms-in-usa-after-btech",
    title: "MS in USA After B.Tech: What Should You Prepare?",
    category: "USA",
    date: "2026-06-30",
    displayDate: "30 June 2026",
    readingTime: "8 min read",
    image: usa,
    imageAlt: "American university campus building in autumn",
    excerpt:
      "GRE or no GRE, funding, assistantships and application volume — a grounded look at preparing for a US master's programme.",
    body: [
      {
        paragraphs: [
          "The USA remains the largest destination for Indian postgraduate students, and also the one with the widest variation between universities. Two applicants with the same CGPA can end up with completely different outcomes depending on how they applied.",
        ],
      },
      {
        heading: "Test requirements",
        paragraphs: [
          "Many departments have made the GRE optional. Others still weigh it heavily, particularly for funded positions. Check each programme rather than relying on general advice.",
        ],
      },
      {
        heading: "Funding realities",
        paragraphs: [
          "Assistantships exist but are competitive and often awarded after the first semester. Plan your budget assuming you fund the first year, and treat funding as an upside rather than a certainty.",
        ],
      },
      {
        heading: "Application volume",
        paragraphs: [
          "Applying to fifteen universities rarely helps. Five to six well-matched applications with strong, tailored statements usually produce better results.",
        ],
      },
      {
        paragraphs: [
          "Requirements, fees and post-study conditions change between intakes and should always be verified for the year you are applying.",
        ],
      },
    ],
  },
  {
    slug: "ielts-vs-pte",
    title: "IELTS vs PTE: Understanding the Difference",
    category: "IELTS / PTE",
    date: "2026-06-12",
    displayDate: "12 June 2026",
    readingTime: "5 min read",
    image: hero,
    imageAlt: "Student on a university campus at golden hour",
    excerpt:
      "Both are widely accepted. The right choice depends on how you perform under different test formats, not on which is easier.",
    body: [
      {
        paragraphs: [
          "Students often ask which test is easier. A more useful question is which format matches the way you work.",
        ],
      },
      {
        heading: "Format",
        paragraphs: [
          "IELTS includes a face-to-face or recorded speaking section with an examiner. PTE is fully computer-based and scored by an automated system.",
        ],
      },
      {
        heading: "Results and scheduling",
        paragraphs: [
          "PTE results typically arrive faster, which can matter close to a deadline. IELTS has very wide institutional acceptance and a large volume of preparation material available.",
        ],
      },
      {
        heading: "Choosing",
        paragraphs: [
          "If you are comfortable speaking to a person and prefer handwritten practice, IELTS suits you. If you type quickly and prefer a consistent computer interface, PTE may be a better fit. Always confirm which tests your shortlisted universities accept.",
        ],
      },
    ],
  },
  {
    slug: "how-to-shortlist-universities",
    title: "How to Shortlist Universities Without Guesswork",
    category: "Applications",
    date: "2026-05-28",
    displayDate: "28 May 2026",
    readingTime: "6 min read",
    image: uk,
    imageAlt: "University quadrangle with stone architecture",
    excerpt:
      "A shortlist should be built from five variables, not from a ranking table. Here is the framework we use in counselling sessions.",
    body: [
      {
        paragraphs: [
          "Rankings are the most visible information about a university and among the least useful for an individual decision. A good shortlist balances five things.",
        ],
        bullets: [
          "Academic fit: does your profile meet the stated requirements?",
          "Course content: do the modules match your intended career?",
          "Total cost: tuition plus realistic living costs in that city",
          "Location: employment landscape, climate, community",
          "Intake and deadlines: can you realistically submit in time?",
        ],
      },
      {
        heading: "Build in three tiers",
        paragraphs: [
          "Include one or two ambitious options, two or three matched options and one safer option. This structure protects you from an all-or-nothing outcome.",
        ],
      },
      {
        heading: "Write down the reason for each choice",
        paragraphs: [
          "If you cannot explain in one sentence why a university is on your list, it probably should not be.",
        ],
      },
    ],
  },
  {
    slug: "study-abroad-application-timeline",
    title: "Study Abroad Application Timeline: A Month-by-Month View",
    category: "Applications",
    date: "2026-05-09",
    displayDate: "9 May 2026",
    readingTime: "6 min read",
    image: canada,
    imageAlt: "Canadian university campus in autumn",
    excerpt:
      "A twelve-month view of what should be happening when, from profile review to pre-departure preparation.",
    body: [
      {
        paragraphs: [
          "Late applications, not weak profiles, cause most missed intakes. This timeline assumes a September or Fall intake and can be shifted for other intakes.",
        ],
        bullets: [
          "Months 12–10: profile evaluation, budget discussion, exam booking",
          "Months 10–8: exams completed, specialisation decided",
          "Months 8–6: shortlist finalised, SOP drafted, LORs requested",
          "Months 6–4: applications submitted, scholarship applications sent",
          "Months 4–2: offers compared, deposit paid, financial documents ready",
          "Final 2 months: visa documentation, accommodation, travel and pre-departure briefing",
        ],
      },
      {
        heading: "Build slack into the plan",
        paragraphs: [
          "Transcripts, attestations and referee responses routinely take longer than expected. Two weeks of slack in each stage prevents most last-minute problems.",
        ],
      },
    ],
  },
  {
    slug: "germany-after-btech",
    title: "Studying in Germany After B.Tech: What Engineering Students Should Know",
    category: "Germany",
    date: "2026-04-22",
    displayDate: "22 April 2026",
    readingTime: "7 min read",
    image: germany,
    imageAlt: "German university town with a modern research building",
    excerpt:
      "Low tuition is only one part of the picture. Documentation, language and intake structure matter just as much.",
    body: [
      {
        paragraphs: [
          "Germany attracts engineering graduates for good reasons: strong technical universities and very low tuition at public institutions. The process, however, is documentation-heavy.",
        ],
      },
      {
        heading: "Credential documentation",
        paragraphs: [
          "Depending on your situation, credential verification such as an APS certificate may be required. Start this early, as processing takes time.",
        ],
      },
      {
        heading: "Language",
        paragraphs: [
          "English-taught master's programmes are widely available, but basic German helps significantly with part-time work, housing and daily life.",
        ],
      },
      {
        heading: "Financial proof",
        paragraphs: [
          "A blocked account is usually required as financial evidence. The amount is set by current regulations and should be confirmed for your application year.",
        ],
      },
    ],
  },
  {
    slug: "australia-intakes-explained",
    title: "Australian Intakes Explained: February vs July",
    category: "Australia",
    date: "2026-04-03",
    displayDate: "3 April 2026",
    readingTime: "5 min read",
    image: australia,
    imageAlt: "Australian university sandstone building with palm trees",
    excerpt:
      "The intake you choose affects course availability, scholarship access and how much preparation time you have.",
    body: [
      {
        paragraphs: [
          "Australia's two main intakes give students useful flexibility, but they are not interchangeable.",
        ],
      },
      {
        heading: "February",
        paragraphs: [
          "The larger intake, with the widest course availability and most scholarship rounds. Applications generally need to be ready in the second half of the previous year.",
        ],
      },
      {
        heading: "July",
        paragraphs: [
          "A strong option if you need extra time for exams or documents. Course choice is narrower, so shortlist carefully.",
        ],
      },
    ],
  },
  {
    slug: "questions-parents-ask",
    title: "Seven Questions Parents Ask in Every Counselling Session",
    category: "Study Abroad",
    date: "2026-03-15",
    displayDate: "15 March 2026",
    readingTime: "6 min read",
    image: ireland,
    imageAlt: "University campus lawn with historic buildings",
    excerpt:
      "Parents carry most of the financial risk in a study-abroad decision. These are the questions they raise most often, answered plainly.",
    body: [
      {
        paragraphs: [
          "Study abroad is a family decision. These are the questions we hear from parents most frequently.",
        ],
        bullets: [
          "What is the total cost, including everything?",
          "How safe is the city?",
          "Can my child work part-time while studying?",
          "What happens if the visa is refused?",
          "Is this course actually useful for a career?",
          "Who do we contact if there is a problem abroad?",
          "How much of this can be funded through a loan?",
        ],
      },
      {
        heading: "Why plain answers matter",
        paragraphs: [
          "None of these questions has a promotional answer. Costs vary, visa outcomes rest with authorities, and part-time work rules change. Families make better decisions when they hear ranges and conditions rather than assurances.",
        ],
      },
    ],
  },
];

export const getPost = (slug: string) => blogPosts.find((p) => p.slug === slug);
