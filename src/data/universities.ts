/**
 * PROTOTYPE DATA — these universities are fictional placeholders created for
 * this prototype. APEX makes no partnership claims. Replace with verified data.
 */
export type University = {
  slug: string;
  name: string;
  country: string;
  destinationSlug: string;
  city: string;
  founded: string;
  studyAreas: string[];
  degreeLevels: ("Master's" | "Bachelor's" | "PG Diploma")[];
  programs: string[];
  overview: string;
  whyConsider: string[];
  applicationOverview: { label: string; value: string }[];
  campusNote: string;
};

export const universities: University[] = [
  {
    slug: "western-pacific-university",
    name: "Western Pacific University",
    country: "USA",
    destinationSlug: "usa",
    city: "Seattle, Washington",
    founded: "Est. 1901 (illustrative)",
    studyAreas: ["Computer Science", "Engineering", "Data Science"],
    degreeLevels: ["Master's", "Bachelor's"],
    programs: ["MS Computer Science", "MS Data Science", "MS Electrical Engineering", "MS Engineering Management"],
    overview:
      "A large research-focused university in the Pacific Northwest with strong graduate programmes in computing and engineering, and a well-established international student community.",
    whyConsider: [
      "Wide choice of computing and engineering specialisations",
      "Research assistantship opportunities in selected departments",
      "Located near a major technology employment hub",
    ],
    applicationOverview: [
      { label: "Intakes", value: "Fall, Spring" },
      { label: "Test requirements", value: "IELTS/TOEFL; GRE optional for several programmes" },
      { label: "Documents", value: "Transcripts, SOP, 2–3 LORs, resume" },
    ],
    campusNote: "Urban campus with graduate housing options nearby.",
  },
  {
    slug: "lakeshore-state-university",
    name: "Lakeshore State University",
    country: "USA",
    destinationSlug: "usa",
    city: "Chicago, Illinois",
    founded: "Est. 1923 (illustrative)",
    studyAreas: ["Business", "Information Systems", "Engineering"],
    degreeLevels: ["Master's", "Bachelor's"],
    programs: ["MS Information Systems", "MS Business Analytics", "MS Mechanical Engineering", "MBA"],
    overview:
      "A mid-sized public university with practical, industry-linked master's programmes and a strong focus on employability support for international students.",
    whyConsider: [
      "Balanced tuition compared with larger private institutions",
      "Career services with employer engagement events",
      "Programmes suited to applied, industry-facing careers",
    ],
    applicationOverview: [
      { label: "Intakes", value: "Fall, Spring" },
      { label: "Test requirements", value: "IELTS/TOEFL/PTE; GRE optional" },
      { label: "Documents", value: "Transcripts, SOP, 2 LORs, resume" },
    ],
    campusNote: "City campus with strong public transport connections.",
  },
  {
    slug: "northbridge-university",
    name: "Northbridge University",
    country: "United Kingdom",
    destinationSlug: "uk",
    city: "Manchester, England",
    founded: "Est. 1884 (illustrative)",
    studyAreas: ["Engineering", "Artificial Intelligence", "Business"],
    degreeLevels: ["Master's"],
    programs: ["MSc Advanced Engineering", "MSc Artificial Intelligence", "MSc Business Analytics", "MSc Renewable Energy"],
    overview:
      "A research-active UK university offering focused one-year taught master's degrees, with laboratory facilities in engineering and computing disciplines.",
    whyConsider: [
      "One-year master's structure",
      "Rolling admissions across the September intake",
      "Dedicated international student support office",
    ],
    applicationOverview: [
      { label: "Intakes", value: "September, January" },
      { label: "Test requirements", value: "IELTS/PTE; no GRE" },
      { label: "Documents", value: "Transcripts, personal statement, 1–2 references" },
    ],
    campusNote: "Compact city campus within walking distance of student housing.",
  },
  {
    slug: "maplecrest-university",
    name: "Maplecrest University",
    country: "Canada",
    destinationSlug: "canada",
    city: "Toronto, Ontario",
    founded: "Est. 1957 (illustrative)",
    studyAreas: ["Computer Science", "Project Management", "Supply Chain"],
    degreeLevels: ["Master's", "PG Diploma"],
    programs: ["MSc Computer Science", "Master of Engineering", "PG Diploma Project Management", "Master of Data Analytics"],
    overview:
      "A Canadian university known for co-op learning, with programmes designed around applied projects and work-integrated terms.",
    whyConsider: [
      "Co-op options in selected programmes",
      "Moderate tuition relative to comparable programmes",
      "Diverse, multilingual campus community",
    ],
    applicationOverview: [
      { label: "Intakes", value: "September, January, May" },
      { label: "Test requirements", value: "IELTS/PTE" },
      { label: "Documents", value: "Transcripts, SOP, 2 LORs, proof of funds" },
    ],
    campusNote: "Suburban campus with direct transit links into the city.",
  },
  {
    slug: "southern-cross-institute",
    name: "Southern Cross Institute",
    country: "Australia",
    destinationSlug: "australia",
    city: "Melbourne, Victoria",
    founded: "Est. 1966 (illustrative)",
    studyAreas: ["Information Technology", "Engineering", "Construction Management"],
    degreeLevels: ["Master's", "Bachelor's"],
    programs: ["Master of Information Technology", "Master of Professional Engineering", "Master of Construction Management"],
    overview:
      "An Australian institute focused on professionally oriented postgraduate coursework, with capstone industry projects in most programmes.",
    whyConsider: [
      "Professionally accredited engineering pathways",
      "February and July intakes",
      "Capstone projects with industry partners",
    ],
    applicationOverview: [
      { label: "Intakes", value: "February, July" },
      { label: "Test requirements", value: "IELTS/PTE" },
      { label: "Documents", value: "Transcripts, SOP, resume, financial evidence" },
    ],
    campusNote: "Inner-city campus close to student accommodation districts.",
  },
  {
    slug: "rhine-valley-university",
    name: "Rhine Valley University",
    country: "Germany",
    destinationSlug: "germany",
    city: "Cologne, North Rhine-Westphalia",
    founded: "Est. 1971 (illustrative)",
    studyAreas: ["Embedded Systems", "Automotive Engineering", "Mechatronics"],
    degreeLevels: ["Master's"],
    programs: ["MS Embedded Systems", "MS Automotive Engineering", "MS Mechatronics", "MS Renewable Energy Systems"],
    overview:
      "A technical university with an engineering-first curriculum, English-taught master's options and close cooperation with regional engineering industry.",
    whyConsider: [
      "Low semester contribution instead of high tuition",
      "Thesis projects linked to engineering companies",
      "Strong focus on hardware and systems engineering",
    ],
    applicationOverview: [
      { label: "Intakes", value: "Winter (October), limited Summer (April)" },
      { label: "Test requirements", value: "IELTS/TOEFL; APS where applicable" },
      { label: "Documents", value: "Transcripts, SOP, LORs, blocked account proof" },
    ],
    campusNote: "Technical campus with laboratory-heavy facilities.",
  },
  {
    slug: "emerald-coast-university",
    name: "Emerald Coast University",
    country: "Ireland",
    destinationSlug: "ireland",
    city: "Dublin",
    founded: "Est. 1989 (illustrative)",
    studyAreas: ["Computer Science", "Data Analytics", "Pharmaceutical Sciences"],
    degreeLevels: ["Master's"],
    programs: ["MSc Computer Science", "MSc Data Analytics", "MSc Pharmaceutical Sciences", "MSc Financial Technology"],
    overview:
      "A modern Irish university with twelve-month taught master's programmes and links to technology and life sciences employers in the Dublin region.",
    whyConsider: [
      "One-year programme duration",
      "Located near major technology employers",
      "English-taught study within the European Union",
    ],
    applicationOverview: [
      { label: "Intakes", value: "September, limited January" },
      { label: "Test requirements", value: "IELTS/PTE" },
      { label: "Documents", value: "Transcripts, SOP, references" },
    ],
    campusNote: "Modern campus with on-site student residences.",
  },
  {
    slug: "highland-metropolitan-university",
    name: "Highland Metropolitan University",
    country: "United Kingdom",
    destinationSlug: "uk",
    city: "Edinburgh, Scotland",
    founded: "Est. 1902 (illustrative)",
    studyAreas: ["Business", "Data Science", "Construction Management"],
    degreeLevels: ["Master's", "Bachelor's"],
    programs: ["MSc Data Science", "MSc International Business", "MSc Construction Project Management"],
    overview:
      "A city university with applied master's programmes, industry placements in selected courses and a strong postgraduate international cohort.",
    whyConsider: [
      "Applied, career-focused course design",
      "Placement options in selected programmes",
      "Two intakes per academic year",
    ],
    applicationOverview: [
      { label: "Intakes", value: "September, January" },
      { label: "Test requirements", value: "IELTS/PTE" },
      { label: "Documents", value: "Transcripts, personal statement, references" },
    ],
    campusNote: "Historic city location with several campus buildings.",
  },
];

export const getUniversity = (slug: string) => universities.find((u) => u.slug === slug);

export const universityFilters = {
  countries: [...new Set(universities.map((u) => u.country))],
  studyAreas: [...new Set(universities.flatMap((u) => u.studyAreas))].sort(),
  degreeLevels: [...new Set(universities.flatMap((u) => u.degreeLevels))],
};

export const UNIVERSITY_DISCLAIMER =
  "University information shown in this prototype is illustrative and should be replaced with verified information before launch. APEX does not claim any partnership with the institutions listed here.";
