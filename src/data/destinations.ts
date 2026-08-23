import usa from "@/assets/dest-usa.jpg";
import uk from "@/assets/dest-uk.jpg";
import canada from "@/assets/dest-canada.jpg";
import australia from "@/assets/dest-australia.jpg";
import germany from "@/assets/dest-germany.jpg";
import ireland from "@/assets/dest-ireland.jpg";

/** PROTOTYPE DATA — illustrative destination content, replace before launch. */
export type Destination = {
  slug: string;
  country: string;
  region: "North America" | "Europe" | "UK & Ireland" | "Asia-Pacific";
  tagline: string;
  short: string;
  image: string;
  imageAlt: string;
  popularAreas: string[];
  costIndicator: string;
  budgetBand: "moderate" | "high";
  whyStudy: { title: string; text: string }[];
  popularCourses: string[];
  admissionOverview: string[];
  intakes: { name: string; note: string }[];
  costOverview: { label: string; value: string }[];
  scholarships: string[];
  careers: string;
  universities: string[];
  faqs: { q: string; a: string }[];
};

export const destinations: Destination[] = [
  {
    slug: "usa",
    country: "USA",
    region: "North America",
    tagline: "Research depth, flexibility and scale",
    short:
      "A wide range of universities, strong research funding and flexible curricula make the USA a long-standing choice for postgraduate study.",
    image: usa,
    imageAlt: "Red brick American university building with a clock tower on an autumn campus",
    popularAreas: ["Computer Science", "Data Science", "Engineering Management", "Electrical Engineering"],
    costIndicator: "Higher tuition, wide scholarship and assistantship options",
    budgetBand: "high",
    whyStudy: [
      { title: "Breadth of universities", text: "Options across a very wide range of profiles, budgets and specialisations." },
      { title: "Research culture", text: "Labs, assistantships and industry-linked projects are common at postgraduate level." },
      { title: "Flexible curriculum", text: "Students can often shape electives around a specific career direction." },
      { title: "Large alumni networks", text: "Strong Indian student communities on most large campuses." },
    ],
    popularCourses: [
      "MS in Computer Science",
      "MS in Data Science / Analytics",
      "MS in Electrical & Computer Engineering",
      "MS in Engineering Management",
      "MS in Mechanical Engineering",
      "MS in Information Systems",
    ],
    admissionOverview: [
      "Bachelor's degree with a competitive academic record",
      "GRE required by some programmes, optional at others",
      "English proficiency through IELTS, TOEFL or PTE",
      "Statement of purpose and two to three recommendation letters",
      "Proof of funds for the visa application stage",
    ],
    intakes: [
      { name: "Fall (Aug–Sep)", note: "The largest intake with the widest programme choice." },
      { name: "Spring (Jan)", note: "Smaller intake; fewer funding opportunities." },
      { name: "Summer (May)", note: "Limited programmes only." },
    ],
    costOverview: [
      { label: "Tuition (per year, indicative)", value: "USD 22,000 – 55,000" },
      { label: "Living costs (per year, indicative)", value: "USD 12,000 – 20,000" },
      { label: "Application fees", value: "USD 60 – 120 per university" },
    ],
    scholarships: [
      "Merit-based partial tuition awards from individual universities",
      "Graduate assistantships and research assistantships (department dependent)",
      "External and India-based education trust scholarships",
    ],
    careers:
      "Many postgraduate programmes are connected to internships and practical training pathways. Work options depend on programme type and prevailing regulations, which should be checked for the relevant intake.",
    universities: ["western-pacific-university", "lakeshore-state-university"],
    faqs: [
      { q: "Is GRE mandatory for MS in the USA?", a: "Not everywhere. Several universities have made GRE optional, while some competitive programmes still expect it. We review this university by university." },
      { q: "When should I start preparing?", a: "Ideally 10–12 months before your intended intake, so exams, documents and applications are not rushed." },
    ],
  },
  {
    slug: "uk",
    country: "United Kingdom",
    region: "UK & Ireland",
    tagline: "One-year master's with strong global recognition",
    short:
      "Focused one-year master's programmes, a familiar academic structure and strong global recognition of UK qualifications.",
    image: uk,
    imageAlt: "Gothic stone university quadrangle with a green lawn in the United Kingdom",
    popularAreas: ["Advanced Engineering", "Business Analytics", "Artificial Intelligence", "Management"],
    costIndicator: "Moderate to high tuition, shorter overall course duration",
    budgetBand: "high",
    whyStudy: [
      { title: "One-year master's", text: "Shorter duration can reduce overall tuition and living costs." },
      { title: "Clear specialisations", text: "Programmes are usually tightly defined around a subject area." },
      { title: "Rolling admissions", text: "Many universities assess applications as they arrive." },
      { title: "Well-connected cities", text: "Study locations across England, Scotland, Wales and Northern Ireland." },
    ],
    popularCourses: [
      "MSc Advanced Engineering",
      "MSc Artificial Intelligence",
      "MSc Business Analytics",
      "MSc Data Science",
      "MSc Construction Project Management",
      "MSc Renewable Energy",
    ],
    admissionOverview: [
      "Bachelor's degree with the percentage or CGPA required by the programme",
      "IELTS, PTE or an accepted alternative English test",
      "Personal statement and academic references",
      "GRE/GMAT usually not required",
    ],
    intakes: [
      { name: "September", note: "Main intake with the widest choice of programmes." },
      { name: "January", note: "Second intake, available for many taught master's courses." },
    ],
    costOverview: [
      { label: "Tuition (per year, indicative)", value: "GBP 15,000 – 32,000" },
      { label: "Living costs (per year, indicative)", value: "GBP 10,000 – 15,000" },
      { label: "Application fees", value: "Usually none for taught master's" },
    ],
    scholarships: [
      "University merit scholarships for strong academic profiles",
      "Regional and international student awards",
      "Departmental bursaries in selected subject areas",
    ],
    careers:
      "The UK offers post-study pathways that vary with policy and course level. Students should confirm current conditions for their intake before applying.",
    universities: ["northbridge-university"],
    faqs: [
      { q: "Are one-year master's degrees respected?", a: "Yes — UK taught master's programmes are a standard, widely recognised qualification." },
      { q: "Can I apply without IELTS?", a: "Some universities accept alternatives or internal assessments. This varies and must be checked per university." },
    ],
  },
  {
    slug: "canada",
    country: "Canada",
    region: "North America",
    tagline: "Balanced costs and a welcoming student environment",
    short:
      "A balance of quality, cost and quality of life, with strong co-op and practical learning options at many institutions.",
    image: canada,
    imageAlt: "Canadian university campus with autumn maple trees and a glass academic building",
    popularAreas: ["Computer Science", "Project Management", "Supply Chain", "Civil Engineering"],
    costIndicator: "Moderate tuition and living costs",
    budgetBand: "moderate",
    whyStudy: [
      { title: "Co-op programmes", text: "Several institutions embed paid work terms into the curriculum." },
      { title: "Balanced costs", text: "Tuition is often lower than comparable programmes in the USA or UK." },
      { title: "Multicultural cities", text: "Large, diverse student communities in most major cities." },
      { title: "Pathway options", text: "Both university master's degrees and post-graduate diplomas are available." },
    ],
    popularCourses: [
      "Master of Engineering (Various)",
      "MSc Computer Science",
      "Post-Graduate Diploma in Project Management",
      "MSc Supply Chain Management",
      "Master of Data Analytics",
    ],
    admissionOverview: [
      "Bachelor's degree with a consistent academic record",
      "IELTS or PTE, with minimum band requirements per programme",
      "Statement of purpose and references",
      "Proof of funds, often through a Guaranteed Investment Certificate route",
    ],
    intakes: [
      { name: "September (Fall)", note: "Primary intake across most institutions." },
      { name: "January (Winter)", note: "Widely available second intake." },
      { name: "May (Summer)", note: "Limited programme availability." },
    ],
    costOverview: [
      { label: "Tuition (per year, indicative)", value: "CAD 17,000 – 35,000" },
      { label: "Living costs (per year, indicative)", value: "CAD 12,000 – 18,000" },
      { label: "Application fees", value: "CAD 90 – 150 per institution" },
    ],
    scholarships: [
      "Entrance scholarships at selected universities",
      "Graduate research funding for thesis-based programmes",
      "Institution-specific international student awards",
    ],
    careers:
      "Co-op and internship experience is valued by employers. Work and post-study pathways depend on programme type and current regulations.",
    universities: ["maplecrest-university"],
    faqs: [
      { q: "Diploma or master's — which is better?", a: "It depends on your goals, budget and academic record. We compare both options against your profile before recommending a direction." },
    ],
  },
  {
    slug: "australia",
    country: "Australia",
    region: "Asia-Pacific",
    tagline: "Practical programmes and a strong student lifestyle",
    short:
      "Industry-aligned coursework, multiple intakes and a comfortable student lifestyle across large coastal cities.",
    image: australia,
    imageAlt: "Sunlit Australian university sandstone building with palm trees and a city skyline",
    popularAreas: ["Information Technology", "Engineering", "Construction Management", "Business"],
    costIndicator: "Moderate to high tuition, strong part-time work culture",
    budgetBand: "high",
    whyStudy: [
      { title: "Industry-aligned courses", text: "Coursework master's programmes often include capstone or industry projects." },
      { title: "Two main intakes", text: "February and July intakes give flexible planning windows." },
      { title: "Professional accreditation", text: "Engineering and IT courses are frequently accredited by professional bodies." },
      { title: "Student support", text: "Well-established international student services at most universities." },
    ],
    popularCourses: [
      "Master of Information Technology",
      "Master of Professional Engineering",
      "Master of Construction Management",
      "Master of Business Analytics",
      "Master of Data Science",
    ],
    admissionOverview: [
      "Bachelor's degree in a related discipline for most master's courses",
      "IELTS or PTE with course-specific minimums",
      "Statement of purpose and, sometimes, a genuine student assessment",
      "Evidence of funds for tuition and living expenses",
    ],
    intakes: [
      { name: "February (Semester 1)", note: "Largest intake of the year." },
      { name: "July (Semester 2)", note: "Broadly available across universities." },
      { name: "November", note: "Limited to selected courses." },
    ],
    costOverview: [
      { label: "Tuition (per year, indicative)", value: "AUD 30,000 – 48,000" },
      { label: "Living costs (per year, indicative)", value: "AUD 21,000 – 28,000" },
      { label: "Application fees", value: "AUD 50 – 150 per university" },
    ],
    scholarships: [
      "International merit scholarships from individual universities",
      "Faculty-level tuition reductions in selected disciplines",
      "Regional study incentives at some campuses",
    ],
    careers:
      "Practical coursework and part-time work experience are common. Post-study work eligibility varies with qualification level and current rules.",
    universities: ["southern-cross-institute"],
    faqs: [
      { q: "Which intake should I target?", a: "February usually has the widest choice, but July is a good option if you need more preparation time." },
    ],
  },
  {
    slug: "germany",
    country: "Germany",
    region: "Europe",
    tagline: "Engineering strength with low tuition at public universities",
    short:
      "Strong engineering and technology education, with many public universities charging little or no tuition fees.",
    image: germany,
    imageAlt: "German university town riverside with historic buildings and a modern glass research building",
    popularAreas: ["Embedded Systems", "Automotive Engineering", "Mechatronics", "Renewable Energy"],
    costIndicator: "Low tuition at public universities; living costs apply",
    budgetBand: "moderate",
    whyStudy: [
      { title: "Low tuition", text: "Many public universities charge only a semester contribution." },
      { title: "Engineering reputation", text: "Deep strength in mechanical, electrical and automotive disciplines." },
      { title: "Industry links", text: "Working student and thesis opportunities with engineering companies." },
      { title: "English-taught master's", text: "A growing number of programmes are delivered fully in English." },
    ],
    popularCourses: [
      "MS Embedded Systems",
      "MS Automotive Engineering",
      "MS Mechatronics",
      "MS Renewable Energy Systems",
      "MS Data Engineering",
    ],
    admissionOverview: [
      "Bachelor's degree recognised as equivalent for the chosen programme",
      "IELTS/TOEFL; German language useful for daily life and some courses",
      "APS certificate and credential documentation where applicable",
      "Blocked account as financial proof for the visa stage",
    ],
    intakes: [
      { name: "Winter (Oct)", note: "Main intake with most programme options." },
      { name: "Summer (Apr)", note: "Available for a smaller set of programmes." },
    ],
    costOverview: [
      { label: "Tuition (public universities, indicative)", value: "EUR 0 – 500 per semester contribution" },
      { label: "Living costs (per year, indicative)", value: "EUR 11,000 – 13,000" },
      { label: "Blocked account (indicative)", value: "Amount set by current regulations" },
    ],
    scholarships: [
      "DAAD and similar public scholarship programmes",
      "University and faculty-specific stipends",
      "Working student roles that support living costs",
    ],
    careers:
      "Engineering graduates often find roles connected to their thesis or working student experience. Job-seeking and residence rules should be verified for the relevant year.",
    universities: ["rhine-valley-university"],
    faqs: [
      { q: "Do I need to learn German?", a: "Not always for English-taught programmes, but basic German helps considerably with daily life and part-time work." },
      { q: "Are backlogs a problem?", a: "Requirements vary by university. Profiles are assessed individually, and we advise based on your specific transcript." },
    ],
  },
  {
    slug: "ireland",
    country: "Ireland",
    region: "UK & Ireland",
    tagline: "A compact, tech-focused European destination",
    short:
      "An English-speaking European destination with strong technology and pharmaceutical sectors and one-year master's programmes.",
    image: ireland,
    imageAlt: "Irish university campus with Georgian stone buildings and green lawns",
    popularAreas: ["Computer Science", "Data Analytics", "Pharmaceutical Sciences", "Finance"],
    costIndicator: "Moderate tuition, higher living costs in Dublin",
    budgetBand: "moderate",
    whyStudy: [
      { title: "One-year master's", text: "Taught programmes are typically completed in twelve months." },
      { title: "Technology sector", text: "Many global technology and pharmaceutical companies operate locally." },
      { title: "English-speaking EU", text: "Study in English while based in the European Union." },
      { title: "Compact student cities", text: "Easy to navigate, with strong campus communities." },
    ],
    popularCourses: [
      "MSc Computer Science",
      "MSc Data Analytics",
      "MSc Pharmaceutical Sciences",
      "MSc Financial Technology",
      "MEng Electronic Engineering",
    ],
    admissionOverview: [
      "Bachelor's degree in a relevant discipline",
      "IELTS or PTE at the level set by the programme",
      "Statement of purpose and references",
      "Financial documentation for the visa stage",
    ],
    intakes: [
      { name: "September", note: "Primary intake for most master's programmes." },
      { name: "January", note: "Limited programme availability." },
    ],
    costOverview: [
      { label: "Tuition (per year, indicative)", value: "EUR 13,000 – 26,000" },
      { label: "Living costs (per year, indicative)", value: "EUR 10,000 – 14,000" },
      { label: "Application fees", value: "EUR 35 – 100 per university" },
    ],
    scholarships: [
      "University international merit awards",
      "Government-supported scholarship schemes",
      "Departmental research funding for selected programmes",
    ],
    careers:
      "Graduates often target technology, analytics and life sciences roles. Post-study stay options depend on current immigration rules.",
    universities: ["emerald-coast-university"],
    faqs: [
      { q: "Is Ireland cheaper than the UK?", a: "Tuition can be comparable; living costs vary considerably between Dublin and smaller cities." },
    ],
  },
];

export const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);
