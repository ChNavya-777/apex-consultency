/** PROTOTYPE DATA — FAQ content for the prototype; verify before launch. */
export type Faq = {
  q: string;
  a: string;
  category:
    | "General"
    | "Admissions"
    | "Exams"
    | "Universities"
    | "Applications"
    | "Visa"
    | "Costs";
};

export const faqs: Faq[] = [
  {
    category: "General",
    q: "Can I study abroad after B.Tech?",
    a: "Yes. A four-year engineering degree is accepted for postgraduate entry across most of our destinations. The suitable specialisation depends on your branch, project work and career direction.",
  },
  {
    category: "General",
    q: "Which country is best for my profile?",
    a: "There is no single best country. We compare your academic record, budget, preferred course and long-term plans against each destination, and usually shortlist two or three that fit.",
  },
  {
    category: "General",
    q: "Do you charge for the first consultation?",
    a: "The initial consultation is free. It covers profile evaluation and an overview of your realistic options.",
  },
  {
    category: "General",
    q: "Can my parents join the counselling session?",
    a: "We encourage it. Most study-abroad decisions are family decisions, and parents usually have important questions about cost and safety.",
  },
  {
    category: "Exams",
    q: "Do I need IELTS or PTE?",
    a: "Most universities require proof of English proficiency, and IELTS or PTE are the common routes. Some institutions accept alternatives. We confirm requirements for each university on your shortlist.",
  },
  {
    category: "Exams",
    q: "Is GRE still required?",
    a: "Many programmes have made the GRE optional, but some competitive courses still expect it. We check this programme by programme rather than assuming.",
  },
  {
    category: "Exams",
    q: "What score should I target?",
    a: "Targets depend on your shortlist. We set a realistic band based on the requirements of the universities you are aiming for.",
  },
  {
    category: "Admissions",
    q: "How early should I start my application?",
    a: "Around ten to twelve months before your intended intake. That leaves comfortable time for exams, documents, applications and visa preparation.",
  },
  {
    category: "Admissions",
    q: "Can students with backlogs apply?",
    a: "In many cases, yes. Tolerance for backlogs varies by university and country, and we advise based on your actual transcript rather than a general rule.",
  },
  {
    category: "Admissions",
    q: "Does a study gap affect my application?",
    a: "A gap is not automatically a problem if it can be explained clearly. Work experience, certifications or family circumstances are all valid contexts.",
  },
  {
    category: "Universities",
    q: "How many universities should I apply to?",
    a: "Usually four to six, balanced across ambitious, matched and safer options. A very long list rarely improves outcomes.",
  },
  {
    category: "Universities",
    q: "Do you have partnerships with universities?",
    a: "The universities shown in this prototype are illustrative examples only. Any real institutional relationships will be listed here once verified.",
  },
  {
    category: "Universities",
    q: "How do you decide which universities suit me?",
    a: "We weigh your academic record, exam scores, budget, preferred location, course structure and intake availability together, then explain the reasoning for each option.",
  },
  {
    category: "Applications",
    q: "Do you write my statement of purpose for me?",
    a: "No. We help you structure and refine your own statement so it stays authentic to your background and goals.",
  },
  {
    category: "Applications",
    q: "Who should write my recommendation letters?",
    a: "Usually faculty who have taught or supervised you, and a manager if you have work experience. We provide guidance for your referees.",
  },
  {
    category: "Applications",
    q: "What documents will I need?",
    a: "Typically transcripts, degree certificates, exam scorecards, statement of purpose, recommendation letters, resume, passport and financial documents. We share a destination-specific checklist.",
  },
  {
    category: "Visa",
    q: "Do you help with visa guidance?",
    a: "Yes. We help you prepare and organise documentation and understand each step. Visa decisions are made solely by the relevant authorities.",
  },
  {
    category: "Visa",
    q: "Can you guarantee a visa?",
    a: "No consultancy can. We focus on preparing a complete, accurate and well-documented application.",
  },
  {
    category: "Costs",
    q: "How much does studying abroad cost?",
    a: "It varies widely by destination, university and city. We prepare an indicative budget covering tuition, living costs, travel and one-time expenses, which should be verified for your intake.",
  },
  {
    category: "Costs",
    q: "Can I get an education loan?",
    a: "Many students fund their studies partly through education loans. We explain the documents lenders typically ask for; the loan decision rests with the lender.",
  },
  {
    category: "Costs",
    q: "Are scholarships realistic for average profiles?",
    a: "Partial awards are more common than full funding. We identify the awards you are genuinely eligible to apply for.",
  },
];

export const faqCategories = [
  "General",
  "Admissions",
  "Exams",
  "Universities",
  "Applications",
  "Visa",
  "Costs",
] as const;

export const homeFaqs = [
  faqs[0],
  faqs[1],
  faqs[4],
  faqs[7],
  faqs[8],
  faqs[16],
];
