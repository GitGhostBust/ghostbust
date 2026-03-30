// Shared helper: maps a job title string to an industry label.
// Matching is case-insensitive and checks if the title contains the keyword.

const INDUSTRY_MAP = [
  {
    industry: "Technology",
    titles: [
      "software engineer", "web developer", "web designer",
      "frontend developer", "backend developer", "full stack developer",
      "mobile app developer", "data analyst", "data scientist",
      "data engineer", "database administrator", "cybersecurity analyst",
      "network engineer", "IT support specialist", "systems administrator",
      "cloud engineer", "DevOps engineer", "QA tester", "technical writer",
      "scrum master", "product manager",
    ],
  },
  {
    industry: "Engineering",
    titles: [
      "mechanical engineer", "civil engineer", "electrical engineer",
      "chemical engineer", "industrial engineer", "biomedical engineer",
      "structural engineer", "environmental engineer", "aerospace engineer",
    ],
  },
  {
    industry: "Healthcare",
    titles: [
      "registered nurse", "licensed practical nurse", "nurse practitioner",
      "physician assistant", "medical assistant", "dental hygienist",
      "dentist", "pharmacy technician", "pharmacist", "physical therapist",
      "occupational therapist", "speech language pathologist",
      "radiologic technologist", "home health aide", "EMT", "paramedic",
      "surgical technologist", "medical laboratory technician", "optometrist",
      "medical billing specialist", "health information technician",
      "clinical research coordinator", "hospital administrator",
    ],
  },
  {
    industry: "Pharma & Life Sciences",
    titles: [
      "pharma sales representative", "pharma marketing manager",
      "regulatory affairs specialist", "medical science liaison",
      "clinical trial manager", "research scientist", "laboratory technician",
      "microbiologist", "chemist",
    ],
  },
  {
    industry: "Trades & Construction",
    titles: [
      "electrician", "plumber", "HVAC technician", "welder", "carpenter",
      "diesel mechanic", "auto mechanic", "construction foreman",
      "heavy equipment operator", "ironworker", "pipefitter", "roofer",
      "elevator technician", "locksmith", "machinist", "CNC operator",
      "machine operator", "quality inspector",
    ],
  },
  {
    industry: "Manufacturing & Logistics",
    titles: [
      "warehouse associate", "forklift operator", "production supervisor",
      "assembly line worker", "plant manager", "safety coordinator",
      "CDL truck driver", "delivery driver", "dispatcher",
      "supply chain coordinator", "logistics analyst", "freight broker",
    ],
  },
  {
    industry: "Transportation",
    titles: ["airline pilot", "bus driver", "train conductor"],
  },
  {
    industry: "Finance",
    titles: [
      "accountant", "financial analyst", "loan officer", "bank teller",
      "mortgage underwriter", "claims adjuster", "actuary",
      "investment analyst", "tax preparer", "auditor", "bookkeeper",
      "financial advisor", "credit analyst",
    ],
  },
  {
    industry: "Marketing & Sales",
    titles: [
      "marketing manager", "digital marketing specialist", "SEO specialist",
      "social media manager", "sales representative", "account executive",
      "real estate agent", "media buyer", "brand manager",
      "business development representative", "copywriter",
    ],
  },
  {
    industry: "Education",
    titles: [
      "elementary school teacher", "high school teacher",
      "middle school teacher", "special education teacher",
      "school counselor", "school principal", "substitute teacher",
      "ESL teacher", "paraprofessional", "university professor",
      "adjunct professor", "academic advisor", "admissions counselor",
      "research assistant", "financial aid counselor",
    ],
  },
  {
    industry: "Administrative",
    titles: [
      "administrative assistant", "executive assistant", "receptionist",
      "office manager", "data entry clerk", "virtual assistant",
    ],
  },
  {
    industry: "Human Resources",
    titles: [
      "human resources generalist", "HR recruiter", "payroll specialist",
    ],
  },
  {
    industry: "Operations & Management",
    titles: ["operations manager", "project coordinator"],
  },
  {
    industry: "Public Safety & Government",
    titles: [
      "police officer", "firefighter", "corrections officer",
      "social worker", "probation officer", "city planner",
      "public health analyst", "park ranger", "mail carrier",
      "conservation officer",
    ],
  },
  {
    industry: "Legal",
    titles: [
      "paralegal", "legal assistant", "court clerk", "attorney",
      "legal secretary", "compliance officer",
    ],
  },
  {
    industry: "Hospitality & Food Service",
    titles: [
      "hotel front desk manager", "restaurant general manager",
      "executive chef", "line cook", "bartender", "event planner",
      "travel agent", "housekeeper", "concierge",
    ],
  },
  {
    industry: "Retail & Customer Service",
    titles: [
      "store manager", "retail associate", "loss prevention specialist",
      "customer service representative", "call center agent",
      "visual merchandiser",
    ],
  },
  {
    industry: "Design & Creative",
    titles: [
      "graphic designer", "UX designer", "UI designer", "video editor",
      "photographer", "interior designer", "content creator",
      "motion graphics designer", "art director", "animator",
    ],
  },
  {
    industry: "Media & Communications",
    titles: [
      "journalist", "public relations specialist", "communications director",
      "technical editor", "broadcast reporter",
    ],
  },
  {
    industry: "Agriculture & Environment",
    titles: [
      "farm manager", "agricultural inspector", "environmental scientist",
      "veterinary technician", "landscape architect",
    ],
  },
  {
    industry: "Nonprofit & Social Services",
    titles: [
      "grant writer", "program coordinator", "fundraiser",
      "community outreach coordinator", "case manager",
    ],
  },
  {
    industry: "Science & Research",
    titles: ["geologist", "laboratory technician", "research scientist",
      "microbiologist", "chemist"],
  },
  {
    industry: "Wellness & Personal Services",
    titles: [
      "personal trainer", "physical therapy assistant", "massage therapist",
      "cosmetologist", "esthetician",
    ],
  },
];

// Build a flat lookup: lowercase title → industry (longer titles matched first)
const _lookup = [];
for (const { industry, titles } of INDUSTRY_MAP) {
  for (const t of titles) {
    _lookup.push({ needle: t.toLowerCase(), industry });
  }
}
// Sort longest needles first so "licensed practical nurse" beats "nurse"
_lookup.sort((a, b) => b.needle.length - a.needle.length);

/**
 * Returns the industry string for a given job title.
 * Falls back to "Other" if no match is found.
 * @param {string} title
 * @returns {string}
 */
export function mapIndustry(title) {
  if (!title) return "Other";
  const lower = title.toLowerCase();
  for (const { needle, industry } of _lookup) {
    if (lower.includes(needle)) return industry;
  }
  return "Other";
}
