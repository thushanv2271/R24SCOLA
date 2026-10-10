// Listing taxonomy. Mirrors ScolaBackend/Services/CategoryCatalog.cs — keep the
// two in sync (the backend normalises stored rows, this file normalises
// whatever an older backend still returns and drives every picker/filter).
//
// Two kinds of listing:
//   university -> degree programmes (level: Masters / PhD, Bachelors still
//                 accepted), grouped by field of study (QS / ISCED-F style)
//   company    -> employers / jobs, grouped by industry (GICS / LinkedIn
//                 style) with sub-industries and roles inside
// Each group lists its subcategories; the LAST entry of every group is its
// catch-all, used when a legacy value only names the group.

export const KIND_UNIVERSITY = "university";
export const KIND_COMPANY = "company";

export const UNIVERSITY_CATEGORIES = [
  {
    name: "Computing & IT",
    subcategories: [
      "Computer Science",
      "Software Engineering",
      "Data Science & AI",
      "Cybersecurity",
      "Information Systems",
      "Cloud & Networking",
      "Human-Computer Interaction",
      "Computer Graphics & Games",
      "General Computing",
    ],
  },
  {
    name: "Engineering",
    subcategories: [
      "Mechanical Engineering",
      "Electrical & Electronic Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Materials Engineering",
      "Aerospace Engineering",
      "Industrial & Manufacturing Engineering",
      "Biomedical Engineering",
      "Environmental Engineering",
      "Petroleum & Mining Engineering",
      "Robotics & Mechatronics",
      "Energy & Renewable Engineering",
      "Telecommunications Engineering",
      "Marine & Naval Engineering",
      "General Engineering",
    ],
  },
  {
    name: "Architecture & Built Environment",
    subcategories: [
      "Architecture",
      "Urban & Regional Planning",
      "Landscape Architecture",
      "Construction Management",
      "Real Estate & Property",
      "General Built Environment",
    ],
  },
  {
    name: "Natural Sciences",
    subcategories: [
      "Chemistry",
      "Physics",
      "Astronomy & Space Science",
      "Mathematics & Statistics",
      "Earth & Geological Sciences",
      "Geography",
      "Oceanography & Marine Science",
      "Meteorology & Climate Science",
      "Materials Science",
      "General Natural Sciences",
    ],
  },
  {
    name: "Life Sciences",
    subcategories: [
      "Biology",
      "Biochemistry",
      "Biotechnology",
      "Microbiology",
      "Genetics & Genomics",
      "Neuroscience",
      "Bioinformatics",
      "Zoology & Wildlife",
      "Marine Biology",
      "General Life Sciences",
    ],
  },
  {
    name: "Health & Medicine",
    subcategories: [
      "Medicine",
      "Dentistry",
      "Nursing",
      "Pharmacy",
      "Public Health",
      "Veterinary Science",
      "Physiotherapy & Rehabilitation",
      "Biomedical Science",
      "Nutrition & Dietetics",
      "Mental Health & Counselling",
      "Health Management",
      "General Health Sciences",
    ],
  },
  {
    name: "Environment & Sustainability",
    subcategories: [
      "Environmental Science",
      "Climate Change & Policy",
      "Sustainable Development",
      "Environmental Management",
      "Conservation & Biodiversity",
      "Water & Waste Management",
      "General Environmental Studies",
    ],
  },
  {
    name: "Agriculture & Food",
    subcategories: [
      "Agriculture & Agronomy",
      "Forestry",
      "Animal Science",
      "Plant Science & Horticulture",
      "Fisheries & Aquaculture",
      "Food Science & Technology",
      "Agribusiness",
      "General Agriculture",
    ],
  },
  {
    name: "Business & Economics",
    subcategories: [
      "Business Administration & MBA",
      "Finance & Accounting",
      "Economics",
      "Marketing",
      "Management & Leadership",
      "Human Resource Management",
      "Entrepreneurship & Innovation",
      "International Business",
      "Supply Chain & Logistics",
      "Project Management",
      "Business Analytics",
      "Banking & Insurance",
      "General Business",
    ],
  },
  {
    name: "Hospitality, Tourism & Sport",
    subcategories: [
      "Hospitality Management",
      "Tourism Management",
      "Event Management",
      "Sports Science",
      "Sports Management",
      "General Hospitality & Sport",
    ],
  },
  {
    name: "Social Sciences",
    subcategories: [
      "Psychology",
      "Sociology",
      "Political Science",
      "International Relations",
      "Anthropology",
      "Social Work",
      "Criminology & Security Studies",
      "Development Studies",
      "Public Policy & Administration",
      "Gender Studies",
      "Social Sciences",
    ],
  },
  {
    name: "Humanities & Languages",
    subcategories: [
      "History",
      "Philosophy",
      "Literature",
      "Linguistics",
      "Modern Languages",
      "Classics & Ancient History",
      "Religious Studies & Theology",
      "Archaeology",
      "Cultural Studies",
      "Translation & Interpreting",
      "Humanities",
    ],
  },
  {
    name: "Arts, Design & Media",
    subcategories: [
      "Fine Arts",
      "Graphic & Visual Design",
      "Fashion & Textile Design",
      "Interior & Product Design",
      "Music",
      "Performing Arts & Theatre",
      "Film & Photography",
      "Media & Communication",
      "Journalism",
      "Creative Writing",
      "Museum & Heritage Studies",
      "Arts & Design",
    ],
  },
  {
    name: "Law & Legal Studies",
    subcategories: [
      "International Law",
      "Commercial & Corporate Law",
      "Human Rights Law",
      "Criminal Law",
      "Environmental Law",
      "Intellectual Property Law",
      "Law",
    ],
  },
  {
    name: "Education & Teaching",
    subcategories: [
      "Teacher Education",
      "Educational Leadership",
      "Curriculum & Instruction",
      "Special & Inclusive Education",
      "Language Teaching (TESOL)",
      "Educational Technology",
      "Early Childhood Education",
      "Education",
    ],
  },
  {
    name: "Multidisciplinary",
    subcategories: [
      "Interdisciplinary Studies",
      "Liberal Arts & Sciences",
      "General Studies",
    ],
  },
];

export const COMPANY_CATEGORIES = [
  {
    name: "Software & IT",
    subcategories: [
      "Software Development",
      "Web & Mobile Development",
      "DevOps & Cloud",
      "QA & Testing",
      "Cybersecurity",
      "IT Support & Infrastructure",
      "Game Development",
      "Embedded & IoT",
      "Blockchain & Web3",
      "Other Software & IT",
    ],
  },
  {
    name: "Data & AI",
    subcategories: [
      "Data Analytics",
      "Data Engineering",
      "Data Science",
      "Business Intelligence",
      "Machine Learning & AI",
      "Computer Vision & NLP",
      "Robotics & Automation",
      "Other Data & AI",
    ],
  },
  {
    name: "Design & Product",
    subcategories: [
      "UI/UX Design",
      "UX Research",
      "Graphic Design",
      "Product Management",
      "Product Design",
      "Illustration & Animation",
      "Motion & Video Design",
      "Other Design & Product",
    ],
  },
  {
    name: "Finance & Banking",
    subcategories: [
      "Finance & Accounting",
      "Banking",
      "Investment & Asset Management",
      "Insurance",
      "Fintech & Payments",
      "Audit & Tax",
      "Other Finance",
    ],
  },
  {
    name: "Healthcare & Life Sciences",
    subcategories: [
      "Hospitals & Clinics",
      "Nursing & Care",
      "Pharmaceuticals",
      "Biotechnology",
      "Medical Devices",
      "Mental Health & Counselling",
      "Dental & Veterinary",
      "Laboratory & Diagnostics",
      "Health Administration",
      "Other Healthcare",
    ],
  },
  {
    name: "Education & Training",
    subcategories: [
      "Schools & Teaching",
      "Universities & Research",
      "EdTech",
      "Corporate Training",
      "Tutoring & Coaching",
      "Other Education",
    ],
  },
  {
    name: "Engineering & Construction",
    subcategories: [
      "Civil & Construction",
      "Mechanical Engineering",
      "Electrical Engineering",
      "Architecture",
      "Surveying & Planning",
      "Project Engineering",
      "Other Engineering",
    ],
  },
  {
    name: "Manufacturing & Industrial",
    subcategories: [
      "Automotive",
      "Aerospace & Defense",
      "Electronics & Hardware",
      "Chemicals & Materials",
      "Textiles & Apparel",
      "Food & Beverage Production",
      "Machinery & Equipment",
      "Packaging & Printing",
      "Other Manufacturing",
    ],
  },
  {
    name: "Energy & Utilities",
    subcategories: [
      "Oil & Gas",
      "Renewable Energy",
      "Electricity & Utilities",
      "Mining & Metals",
      "Water & Waste Management",
      "Environmental Services",
      "Other Energy",
    ],
  },
  {
    name: "Sales & Marketing",
    subcategories: [
      "Sales & Business Development",
      "Account Management",
      "Marketing",
      "Digital Marketing",
      "Advertising & PR",
      "Content & Copywriting",
      "Customer Support",
      "Other Sales & Marketing",
    ],
  },
  {
    name: "Business & Professional Services",
    subcategories: [
      "Human Resources",
      "Operations & Admin",
      "Consulting",
      "Project Management",
      "Procurement & Supply",
      "Research & Analysis",
      "Other Professional Services",
    ],
  },
  {
    name: "Legal & Compliance",
    subcategories: [
      "Law Firms & Legal Counsel",
      "Compliance & Risk",
      "Paralegal & Legal Support",
      "Intellectual Property",
      "Other Legal",
    ],
  },
  {
    name: "Retail & E-commerce",
    subcategories: [
      "Retail Stores",
      "E-commerce",
      "Merchandising",
      "Fashion & Luxury",
      "Consumer Goods (FMCG)",
      "Wholesale & Distribution",
      "Other Retail",
    ],
  },
  {
    name: "Hospitality & Leisure",
    subcategories: [
      "Hotels & Accommodation",
      "Restaurants & Catering",
      "Travel & Tourism",
      "Events",
      "Sports & Fitness",
      "Other Hospitality & Leisure",
    ],
  },
  {
    name: "Transport & Logistics",
    subcategories: [
      "Logistics & Supply Chain",
      "Shipping & Maritime",
      "Aviation & Airlines",
      "Rail & Road Transport",
      "Warehousing & Delivery",
      "Other Transport",
    ],
  },
  {
    name: "Media & Entertainment",
    subcategories: [
      "Journalism & Publishing",
      "Film, TV & Video",
      "Music & Audio",
      "Photography",
      "Gaming & Esports",
      "Other Media",
    ],
  },
  {
    name: "Telecommunications",
    subcategories: [
      "Telecom Operators",
      "Mobile & Wireless",
      "Broadband & Fibre",
      "Satellite & Communications",
      "Other Telecom",
    ],
  },
  {
    name: "Real Estate & Property",
    subcategories: [
      "Property Management",
      "Real Estate Agency",
      "Property Development",
      "Facilities Management",
      "Other Real Estate",
    ],
  },
  {
    name: "Agriculture & Food",
    subcategories: [
      "Farming & Crops",
      "Livestock & Fisheries",
      "Forestry",
      "Agri-Tech",
      "Other Agriculture",
    ],
  },
  {
    name: "Government & Nonprofit",
    subcategories: [
      "Public Administration",
      "Policy & Research",
      "NGOs & Charities",
      "International Organisations",
      "Social Services",
      "Defense & Public Safety",
      "Other Public Sector",
    ],
  },
  {
    name: "Other Industries",
    subcategories: [
      "General",
    ],
  },
];

export const STUDY_LEVELS = ["Bachelors", "Masters", "PhD"];

export const getCategories = (kind) =>
  kind === KIND_COMPANY ? COMPANY_CATEGORIES : UNIVERSITY_CATEGORIES;

export const getGroupNames = (kind) => getCategories(kind).map((group) => group.name);

export const getSubcategories = (kind, groupName) =>
  getCategories(kind).find((group) => group.name === groupName)?.subcategories || [];

const findGroupOf = (kind, subcategory) =>
  getCategories(kind).find((group) => group.subcategories.includes(subcategory))?.name || "";

const isValidPair = (kind, category, subcategory) =>
  !!category && !!subcategory && getSubcategories(kind, category).includes(subcategory);

const FALLBACK = {
  [KIND_UNIVERSITY]: { category: "Multidisciplinary", subcategory: "General Studies" },
  [KIND_COMPANY]: { category: "Other Industries", subcategory: "General" },
};

// ---------------------------------------------------------------------------
// Matching rules (first match wins). Tested against lower-case free text.
// ---------------------------------------------------------------------------

const UNIVERSITY_RULES = [
  [/international law|public international|law of the sea/, "International Law"],
  [/human rights/, "Human Rights Law"],
  [/commercial law|corporate law|business law|company law|competition law|financial law|tax law|banking law/, "Commercial & Corporate Law"],
  [/criminal law|criminal justice law/, "Criminal Law"],
  [/environmental law|energy law|climate law/, "Environmental Law"],
  [/intellectual property|patent|copyright/, "Intellectual Property Law"],
  [/\blaw\b|\blegal\b|jurisprud|\bllm\b|\bllb\b/, "Law"],
  [/health(?:care)? (?:management|administration|informatics|policy|economics)/, "Health Management"],
  [/public policy|public administration|\bmpa\b|\bmpp\b/, "Public Policy & Administration"],
  [/financial engineering|quantitative finance|financial mathematics|mathematical finance/, "Finance & Accounting"],
  [/interdisciplinary|multidisciplinary|cross.disciplinary/, "Interdisciplinary Studies"],
  [/liberal arts|liberal studies/, "Liberal Arts & Sciences"],
  [/sports? (?:management|business|administration|marketing)/, "Sports Management"],
  [/sports? (?:science|psycholog|coaching|exercise)|exercise science|kinesiolog|physical education|human movement/, "Sports Science"],
  [/event (?:management|studies)|events management/, "Event Management"],
  [/hospitality|hotel/, "Hospitality Management"],
  [/tourism|travel/, "Tourism Management"],
  [/early childhood|primary education|childhood education|child development/, "Early Childhood Education"],
  [/special (?:needs )?education|inclusive education/, "Special & Inclusive Education"],
  [/tesol|\btefl\b|teaching english|english language teaching|language teaching/, "Language Teaching (TESOL)"],
  [/educational technolog|e-?learning|learning technolog/, "Educational Technology"],
  [/educational leadership|education(?:al)? (?:management|administration|policy)|school leadership/, "Educational Leadership"],
  [/curriculum|instruction|pedagog/, "Curriculum & Instruction"],
  [/teacher|teaching|pgce|\bb\.?ed\b/, "Teacher Education"],
  [/educat/, "Education"],
  [/chemical (?:and |& )?(?:process )?engineer/, "Chemical Engineering"],
  [/biomedical engineer|bioengineer|biomechanic/, "Biomedical Engineering"],
  [/environmental engineer/, "Environmental Engineering"],
  [/aerospace|aeronautic|avionic|astronautic/, "Aerospace Engineering"],
  [/robotic|mechatronic|automation|control engineer/, "Robotics & Mechatronics"],
  [/petroleum|mining engineer|mineral engineer|mineral processing/, "Petroleum & Mining Engineering"],
  [/marine engineer|naval|offshore engineer|ship ?build/, "Marine & Naval Engineering"],
  [/energy engineer|power (?:system|engineer)|nuclear engineer|renewable energy engineer/, "Energy & Renewable Engineering"],
  [/telecommunication|wireless communication|communications engineer/, "Telecommunications Engineering"],
  [/industrial engineer|manufacturing|production engineer|operations research|systems engineer/, "Industrial & Manufacturing Engineering"],
  [/software/, "Software Engineering"],
  [/cyber|information security|network security|digital forensic/, "Cybersecurity"],
  [/bioinformatic|computational biology/, "Bioinformatics"],
  [/human.computer|\bhci\b|interaction design/, "Human-Computer Interaction"],
  [/computer graphic|computer game|game (?:design|develop)|games? technolog|virtual reality|computer animation/, "Computer Graphics & Games"],
  [/cloud|computer network|networking|distributed system/, "Cloud & Networking"],
  [/business analytic|business intelligence/, "Business Analytics"],
  [/data science|data analytic|machine learning|artificial intelligence|\bai\b|big data|deep learning/, "Data Science & AI"],
  [/information (?:system|technology)|\bict\b|\bit\b|informatics/, "Information Systems"],
  [/computer|computing|computation/, "Computer Science"],
  [/construction management|quantity survey|building management|construction project/, "Construction Management"],
  [/urban|regional planning|town planning|city planning|spatial planning/, "Urban & Regional Planning"],
  [/landscape/, "Landscape Architecture"],
  [/architectur/, "Architecture"],
  [/real estate|property (?:management|development|studies)/, "Real Estate & Property"],
  [/built environment/, "General Built Environment"],
  [/mechanical|automotive|thermal|fluid mechanic/, "Mechanical Engineering"],
  [/electrical|electronic|embedded|semiconductor|vlsi/, "Electrical & Electronic Engineering"],
  [/civil|structural|geotechnical|transport(?:ation)? engineer|highway|water engineer/, "Civil Engineering"],
  [/materials? science|nanotechnolog|polymer/, "Materials Science"],
  [/material|metallurg/, "Materials Engineering"],
  [/engineer/, "General Engineering"],
  [/public health|epidemiolog|global health|health promotion|environmental health|occupational health/, "Public Health"],
  [/nurs|midwif/, "Nursing"],
  [/pharm|toxicolog/, "Pharmacy"],
  [/dentist|dental|oral health/, "Dentistry"],
  [/veterinar/, "Veterinary Science"],
  [/physiotherap|physical therap|rehabilitat|occupational therap|speech therap/, "Physiotherapy & Rehabilitation"],
  [/nutrition|dietet/, "Nutrition & Dietetics"],
  [/mental health|counsel+ing|psychotherap|psychiatr/, "Mental Health & Counselling"],
  [/biomedical|medical (?:science|imaging|laborator)|anatomy|physiology|immunolog/, "Biomedical Science"],
  [/medic|surger|clinical|\bmd\b|\bmbbs\b/, "Medicine"],
  [/health/, "General Health Sciences"],
  [/neuroscien|cognitive neuro/, "Neuroscience"],
  [/genetic|genomic/, "Genetics & Genomics"],
  [/microbio|virolog|bacteriolog/, "Microbiology"],
  [/biochem/, "Biochemistry"],
  [/biotech/, "Biotechnology"],
  [/marine biolog/, "Marine Biology"],
  [/agribusiness|agricultural econom/, "Agribusiness"],
  [/food (?:science|technolog|safety|engineering)/, "Food Science & Technology"],
  [/forest/, "Forestry"],
  [/animal (?:science|husbandry|nutrition)|livestock|dairy/, "Animal Science"],
  [/horticultur|plant (?:science|biology|breeding)|botany/, "Plant Science & Horticulture"],
  [/fisher|aquacultur/, "Fisheries & Aquaculture"],
  [/agricultur|agronom|crop|soil/, "Agriculture & Agronomy"],
  [/zoolog|wildlife|entomolog/, "Zoology & Wildlife"],
  [/conservation|biodiversity/, "Conservation & Biodiversity"],
  [/climate change|climate policy|climate action/, "Climate Change & Policy"],
  [/sustainab/, "Sustainable Development"],
  [/water (?:resource|management)|waste management|hydrolog/, "Water & Waste Management"],
  [/environmental (?:management|policy|studies)/, "Environmental Management"],
  [/biolog|life science|molecular|cell /, "Biology"],
  [/environment|ecolog/, "Environmental Science"],
  [/astronom|astrophys|space (?:science|physics)|cosmolog/, "Astronomy & Space Science"],
  [/oceanograph|marine science|maritime science/, "Oceanography & Marine Science"],
  [/meteorolog|atmospher|climatolog|climate/, "Meteorology & Climate Science"],
  [/geolog|earth science|geophysic|geoscien|geochem|geodes|seismolog/, "Earth & Geological Sciences"],
  [/geograph|geospatial|\bgis\b|remote sensing/, "Geography"],
  [/mathemat|statistic|\bmaths?\b|actuar/, "Mathematics & Statistics"],
  [/chemi/, "Chemistry"],
  [/physic/, "Physics"],
  [/natural science|^science/, "General Natural Sciences"],
  [/business administration|\bmba\b|master of business/, "Business Administration & MBA"],
  [/banking|insurance/, "Banking & Insurance"],
  [/financ|accounting|audit|taxation/, "Finance & Accounting"],
  [/econom|econometric/, "Economics"],
  [/marketing|brand management|advertis|market research/, "Marketing"],
  [/human resource|\bhrm?\b|organi[sz]ational behaviou?r|talent management/, "Human Resource Management"],
  [/entrepreneur|innovation|startup|venture/, "Entrepreneurship & Innovation"],
  [/international business|global business|international trade/, "International Business"],
  [/supply chain|logistic|procurement|operations management|shipping/, "Supply Chain & Logistics"],
  [/project management|programme management/, "Project Management"],
  [/leadership|management|strategy/, "Management & Leadership"],
  [/business|commerce|administration/, "General Business"],
  [/criminolog|criminal justice|security studies|policing|forensic/, "Criminology & Security Studies"],
  [/international relations|diplomacy|global affairs|peace|conflict/, "International Relations"],
  [/development studies|international development|humanitarian/, "Development Studies"],
  [/gender|women'?s studies|feminis/, "Gender Studies"],
  [/social work|social care|social policy/, "Social Work"],
  [/psycholog/, "Psychology"],
  [/sociolog/, "Sociology"],
  [/politic|government|governance/, "Political Science"],
  [/anthropolog|ethnograph/, "Anthropology"],
  [/creative writing/, "Creative Writing"],
  [/journalism/, "Journalism"],
  [/translation|interpreting|interpreter/, "Translation & Interpreting"],
  [/classics|ancient history|\blatin\b|ancient greek/, "Classics & Ancient History"],
  [/archaeolog/, "Archaeology"],
  [/theolog|divinity|religio|islamic|buddhis|biblical/, "Religious Studies & Theology"],
  [/philosoph|ethics/, "Philosophy"],
  [/linguistic/, "Linguistics"],
  [/art history|fine art|painting|sculpture|visual art/, "Fine Arts"],
  [/museum|heritage|curatorial/, "Museum & Heritage Studies"],
  [/cultural studies/, "Cultural Studies"],
  [/literature|english studies|english language|comparative lit/, "Literature"],
  [/modern language|french|german|spanish|chinese|japanese|russian|arabic|italian|korean|language/, "Modern Languages"],
  [/histor/, "History"],
  [/graphic|visual design|illustration|visual communication|typograph/, "Graphic & Visual Design"],
  [/fashion|textile|apparel|costume/, "Fashion & Textile Design"],
  [/interior|product design|industrial design|furniture|jewel/, "Interior & Product Design"],
  [/music|composition|sound|audio/, "Music"],
  [/theatre|theater|drama|dance|performing|acting/, "Performing Arts & Theatre"],
  [/film|cinema|photograph|video|screen|television|broadcast/, "Film & Photography"],
  [/media|communication|public relations/, "Media & Communication"],
  [/humanit/, "Humanities"],
  [/\bsocial\b/, "Social Sciences"],
  [/design|\barts?\b|creative|animation/, "Arts & Design"],
];

// Old, vague labels the data was entered with.
const UNIVERSITY_LEGACY_ALIASES = {
  "health sciences": "General Health Sciences",
  "computer sciences": "Computer Science",
  "computing": "General Computing",
  "marketing & management": "Marketing",
  "business studies": "General Business",
  "social sciences & humanities": "Social Sciences",
  "business administration": "Business Administration & MBA",
  "mba": "Business Administration & MBA",
  "data science": "Data Science & AI",
  "artificial intelligence": "Data Science & AI",
  "mathematics": "Mathematics & Statistics",
  "statistics": "Mathematics & Statistics",
  "geology": "Earth & Geological Sciences",
  "electrical engineering": "Electrical & Electronic Engineering",
  "electronic engineering": "Electrical & Electronic Engineering",
  "computer engineering": "Computer Science",
  "psychology & counselling": "Psychology",
  "law & legal studies": "Law",
  "education & teaching": "Education",
  "arts & humanities": "Humanities",
  "architecture & planning": "Architecture",
  "hospitality & tourism": "Hospitality Management",
};

const COMPANY_RULES = [
  [/account (?:manager|executive)|key account|client partner/, "Account Management"],
  [/telecom|telco/, "Telecom Operators"],
  [/\b5g\b|wireless|mobile network|\bran\b/, "Mobile & Wireless"],
  [/broadband|fib(?:re|er)/, "Broadband & Fibre"],
  [/satellite/, "Satellite & Communications"],
  [/computer vision|\bnlp\b|natural language/, "Computer Vision & NLP"],
  [/machine learning|\bml\b|\bai\b|artificial|deep learning|\bllm\b|generative/, "Machine Learning & AI"],
  [/data engineer|\betl\b|data pipeline|data warehouse|big data|spark|hadoop/, "Data Engineering"],
  [/business intelligence|\bbi\b|power ?bi|tableau|reporting analyst/, "Business Intelligence"],
  [/data scien/, "Data Science"],
  [/data analy|analytics|statistician/, "Data Analytics"],
  [/robotic|automation/, "Robotics & Automation"],
  [/\bux\b research|user research/, "UX Research"],
  [/\bux\b|\bui\b|ui\/ux|user experience|interaction design|web design/, "UI/UX Design"],
  [/product design|industrial design/, "Product Design"],
  [/illustrat|animator|animation|3d artist|concept art/, "Illustration & Animation"],
  [/motion|video edit|videograph/, "Motion & Video Design"],
  [/graphic|brand design|designer/, "Graphic Design"],
  [/product (?:manager|owner|management|lead)|product analyst|program manager/, "Product Management"],
  [/game (?:developer|programmer|design|engineer)|unity|unreal/, "Game Development"],
  [/blockchain|web3|solidity|smart contract/, "Blockchain & Web3"],
  [/embedded|firmware|\biot\b|internet of things|fpga/, "Embedded & IoT"],
  [/devops|\bsre\b|site reliability|cloud|sysadmin|system admin|kubernetes|platform engineer|infrastructure engineer/, "DevOps & Cloud"],
  [/\bqa\b|quality assurance|\btest(?:er|ing)?\b|\bsdet\b/, "QA & Testing"],
  [/cyber|pentest|infosec|information security|network security|application security|security (?:engineer|analyst|architect|consultant)/, "Cybersecurity"],
  [/it support|help ?desk|network|infrastructure|technical support|desktop support/, "IT Support & Infrastructure"],
  [/solutions? architect|software architect|cloud architect|enterprise architect|data architect|technical architect/, "Software Development"],
  [/\bweb\b|front.?end|mobile|android|\bios\b|react|full.?stack|flutter|angular|\bvue\b/, "Web & Mobile Development"],
  [/bank|teller|loan officer|credit analyst|mortgage/, "Banking"],
  [/insurance|underwrit|actuar|claims/, "Insurance"],
  [/investment|portfolio|asset management|wealth|equity research|trader|\bfund\b/, "Investment & Asset Management"],
  [/fintech|payments?\b/, "Fintech & Payments"],
  [/audit|\btax(?:ation)?\b|\bcpa\b/, "Audit & Tax"],
  [/account|financ|payable|receivable|bookkeep|payroll|treasury|controller/, "Finance & Accounting"],
  [/sales|business development/, "Sales & Business Development"],
  [/\bseo\b|\bsem\b|\bppc\b|digital marketing|social media|performance marketing|email marketing|growth/, "Digital Marketing"],
  [/marketing|brand manager|market research/, "Marketing"],
  [/advertis|public relations|\bpr\b|communications (?:manager|officer)|media planner/, "Advertising & PR"],
  [/content|copywrit/, "Content & Copywriting"],
  [/customer (?:support|success|service)|\bsupport\b|call cent/, "Customer Support"],
  [/paralegal|legal assistant|legal secretary/, "Paralegal & Legal Support"],
  [/intellectual property|patent|trademark/, "Intellectual Property"],
  [/compliance|\brisk\b|\baml\b|regulatory/, "Compliance & Risk"],
  [/lawyer|attorney|solicitor|barrister|counsel|legal|\blaw\b/, "Law Firms & Legal Counsel"],
  [/pharmac|clinical research|drug/, "Pharmaceuticals"],
  [/biotech|biolog|genomic/, "Biotechnology"],
  [/medical device|biomedical engineer/, "Medical Devices"],
  [/nurse|nursing|caregiver|care assistant|\bcarer\b/, "Nursing & Care"],
  [/dentist|dental|veterinar|\bvet\b/, "Dental & Veterinary"],
  [/therapist|psycholog|counsell?or|mental health/, "Mental Health & Counselling"],
  [/laborator|diagnostic|radiograph|patholog|phlebotom/, "Laboratory & Diagnostics"],
  [/health (?:care )?(?:administrat|manager|coordinator|informatic)|medical (?:coder|biller|records)/, "Health Administration"],
  [/doctor|physician|surgeon|clinician|hospital|clinic|medical officer|paramedic/, "Hospitals & Clinics"],
  [/health|medical/, "Other Healthcare"],
  [/research (?:assistant|fellow|associate|scientist)|postdoc|lecturer|professor|\bphd\b/, "Universities & Research"],
  [/edtech|e-?learning|learning designer|instructional design/, "EdTech"],
  [/corporate trainer|training (?:manager|specialist)|learning (?:and|&) development|\bl&d\b/, "Corporate Training"],
  [/tutor|academic coach|mentor/, "Tutoring & Coaching"],
  [/teacher|teaching|school|principal|educator|kindergarten|preschool|instructor/, "Schools & Teaching"],
  [/\bhr\b|human resource|recruit|talent|people (?:partner|operations)/, "Human Resources"],
  [/project (?:manager|coordinator|management)|scrum/, "Project Management"],
  [/procure|purchas|\bbuyer\b|sourcing/, "Procurement & Supply"],
  [/consult|advisor|strategy/, "Consulting"],
  [/analyst|researcher/, "Research & Analysis"],
  [/logistic|supply chain|freight|dispatcher|fleet|courier/, "Logistics & Supply Chain"],
  [/shipping|maritime|seafarer|vessel|\bport\b|marine/, "Shipping & Maritime"],
  [/pilot|cabin crew|flight|airline|aviation|aircraft|air traffic/, "Aviation & Airlines"],
  [/driver|truck|\brail|\btrain\b|\bbus\b|chauffeur|taxi/, "Rail & Road Transport"],
  [/warehouse|forklift|delivery|\bpicker\b|\bpacker\b|\bstock\b/, "Warehousing & Delivery"],
  [/civil|structural|construction|site engineer|quantity survey|foreman|builder/, "Civil & Construction"],
  [/architect/, "Architecture"],
  [/mechanical|hvac|maintenance engineer|plant engineer/, "Mechanical Engineering"],
  [/electrical|electrician/, "Electrical Engineering"],
  [/survey|planner|urban planning/, "Surveying & Planning"],
  [/project engineer|engineering manager|process engineer/, "Project Engineering"],
  [/automotive|vehicle/, "Automotive"],
  [/aerospace|avionic|defen[sc]e contractor/, "Aerospace & Defense"],
  [/electronics|\bpcb\b|hardware engineer|semiconductor/, "Electronics & Hardware"],
  [/chemical|chemist|materials|polymer/, "Chemicals & Materials"],
  [/textile|garment|apparel|tailor/, "Textiles & Apparel"],
  [/food (?:production|processing|technolog)|brewer|baker|beverage/, "Food & Beverage Production"],
  [/machinist|\bcnc\b|fabricat|weld|machine operator|assembly|production (?:operator|supervisor|worker)|manufactur/, "Machinery & Equipment"],
  [/packag|\bprint(?:er|ing)?\b/, "Packaging & Printing"],
  [/\boil\b|\bgas\b|petroleum|drilling|refinery/, "Oil & Gas"],
  [/solar|\bwind\b|renewable|photovoltaic|clean energy/, "Renewable Energy"],
  [/mining|\bminer\b|metallurg|geolog/, "Mining & Metals"],
  [/utilit|power plant|electricity|\bgrid\b|energy/, "Electricity & Utilities"],
  [/water|waste|recycl|sanitation/, "Water & Waste Management"],
  [/environmental|sustainab|\besg\b|climate|ecolog/, "Environmental Services"],
  [/e-?commerce|online store|marketplace|shopify/, "E-commerce"],
  [/merchandis|category manager/, "Merchandising"],
  [/fashion|luxury|stylist|boutique/, "Fashion & Luxury"],
  [/fmcg|consumer goods/, "Consumer Goods (FMCG)"],
  [/wholesale|distributor|distribution/, "Wholesale & Distribution"],
  [/retail|cashier|store (?:manager|assistant|associate)|shop assistant|sales associate/, "Retail Stores"],
  [/hotel|front desk|concierge|housekeep|resort/, "Hotels & Accommodation"],
  [/chef|\bcook\b|waiter|waitress|barista|restaurant|kitchen|catering|bartender/, "Restaurants & Catering"],
  [/travel|\btour|tourism/, "Travel & Tourism"],
  [/event (?:manager|coordinator|planner)|wedding/, "Events"],
  [/fitness|personal trainer|\bcoach\b|\bsport|\bgym\b|lifeguard/, "Sports & Fitness"],
  [/journalist|reporter|\beditor\b|publisher|\bauthor\b|newsroom|proofread|\bwriter\b/, "Journalism & Publishing"],
  [/film|video|cinemat|producer|\bdirector\b|\btv\b|television|broadcast|screenwriter/, "Film, TV & Video"],
  [/music|audio|\bsound\b|\bdj\b|singer|podcast/, "Music & Audio"],
  [/photograph/, "Photography"],
  [/esports|game tester|streamer|gamer/, "Gaming & Esports"],
  [/property manager|tenant|leasing/, "Property Management"],
  [/real estate (?:agent|broker)|realtor|estate agent/, "Real Estate Agency"],
  [/property develop|real estate develop/, "Property Development"],
  [/facilit(?:y|ies)|janitor|cleaner|caretaker|building manager|maintenance technician/, "Facilities Management"],
  [/agri-?tech|precision agricultur/, "Agri-Tech"],
  [/farm|\bcrop|agronom|harvest|horticultur/, "Farming & Crops"],
  [/livestock|dairy|poultry|fisher|aquacultur/, "Livestock & Fisheries"],
  [/forest|timber|logging/, "Forestry"],
  [/united nations|\bun\b|unicef|world bank|international organi[sz]ation/, "International Organisations"],
  [/ngo|non-?profit|charity|volunteer|fundrais|humanitarian/, "NGOs & Charities"],
  [/social worker|caseworker|community (?:worker|officer)|youth worker|welfare/, "Social Services"],
  [/policy (?:analyst|advisor|officer)|think tank|public policy/, "Policy & Research"],
  [/police|military|\barmy\b|\bnavy\b|armed forces|firefight|security guard/, "Defense & Public Safety"],
  [/civil servant|government|public (?:sector|administration|servant)|municipal|council officer|ministry/, "Public Administration"],
  [/operations|administrat|coordinator|assistant|secretary|receptionist|office manager|clerk/, "Operations & Admin"],
  [/develop|engineer|programmer|software|back.?end|\bjava\b|python|\.net|\bphp\b|golang|coder/, "Software Development"],
];

const COMPANY_LEGACY_ALIASES = {
  "business & finance": "Other Professional Services",
};

const SOFTWARE_MAJORS = new Set(["computer science", "software engineering", "software development", "computer sciences"]);

// ---------------------------------------------------------------------------

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

// "M Chemistry", "MSc Chemistry", "Master of Chemistry" -> "Chemistry".
const stripDegreePrefix = (value) =>
  clean(value).replace(/^(?:m\.?\s?sc\.?|m\.?\s?s\.?|m\.?\s?a\.?|master'?s?(?:\s+(?:of|in))?|m)\s+(?:of\s+|in\s+)?/i, "");

const matchRules = (rules, text) => {
  const lower = text.toLowerCase();
  const hit = rules.find(([pattern]) => pattern.test(lower));
  return hit ? hit[1] : "";
};

// Exact subcategory name, exact group name (-> its catch-all), or a legacy alias.
const resolveLabel = (kind, label, legacyAliases) => {
  const lower = label.toLowerCase();
  if (!lower) return "";
  for (const group of getCategories(kind)) {
    const exact = group.subcategories.find((sub) => sub.toLowerCase() === lower);
    if (exact) return exact;
  }
  const group = getCategories(kind).find((g) => g.name.toLowerCase() === lower);
  if (group) return group.subcategories[group.subcategories.length - 1];
  return legacyAliases?.[lower] || "";
};

export const normalizeLevel = (level) => {
  const value = clean(level).toLowerCase();
  if (!value) return "Masters";
  if (/ph\.?d|doctor/.test(value)) return "PhD";
  if (/bachelor|undergrad|\bbsc\b|\bba\b/.test(value)) return "Bachelors";
  if (/master|\bmsc\b|\bms\b|postgrad/.test(value)) return "Masters";
  return clean(level);
};

export const detectKind = (item) => {
  if (item?.listingKind === KIND_COMPANY) return KIND_COMPANY;
  if (clean(item?.major).toLowerCase() === "m computer science") return KIND_COMPANY;
  if (/^remote$/i.test(clean(item?.type))) return KIND_COMPANY;
  return KIND_UNIVERSITY;
};

const inferUniversity = (item) => {
  const major = stripDegreePrefix(item.major);
  const sub =
    resolveLabel(KIND_UNIVERSITY, major, UNIVERSITY_LEGACY_ALIASES) ||
    matchRules(UNIVERSITY_RULES, major) ||
    matchRules(UNIVERSITY_RULES, `${item.title || ""} ${item.university || ""}`);
  return sub || FALLBACK[KIND_UNIVERSITY].subcategory;
};

const inferCompany = (item) => {
  const major = stripDegreePrefix(item.major).toLowerCase();
  const remote = /^remote$/i.test(clean(item.type));
  const text = remote ? `${item.title || ""} ${item.qualifications || ""}` : `${item.title || ""}`;
  const isSoftwareMajor = SOFTWARE_MAJORS.has(major);
  if (!remote && isSoftwareMajor) return "Software Development";
  return (
    matchRules(COMPANY_RULES, text) ||
    (isSoftwareMajor ? "Software Development" : "") ||
    resolveLabel(KIND_COMPANY, stripDegreePrefix(item.major), COMPANY_LEGACY_ALIASES) ||
    FALLBACK[KIND_COMPANY].subcategory
  );
};

// Mirrors CategoryCatalog.NormalizeCountry on the backend: one spelling per
// country so "USA" and "United States" never show up as separate places.
const COUNTRY_ALIASES = {
  usa: "United States", us: "United States", "u.s.": "United States", "u.s.a.": "United States",
  "united states of america": "United States", "the united states": "United States", america: "United States",
  uk: "UK", "u.k.": "UK", "united kingdom": "UK", "the united kingdom": "UK", "great britain": "UK",
  britain: "UK", gb: "UK", england: "UK", scotland: "UK", wales: "UK", "northern ireland": "UK",
  uae: "United Arab Emirates (UAE)", "u.a.e.": "United Arab Emirates (UAE)",
  "united arab emirates": "United Arab Emirates (UAE)", emirates: "United Arab Emirates (UAE)",
  korea: "South Korea", "republic of korea": "South Korea", "korea, republic of": "South Korea",
  "korea (south)": "South Korea", "russian federation": "Russia", türkiye: "Turkey", turkiye: "Turkey",
  "the netherlands": "Netherlands", holland: "Netherlands", "people's republic of china": "China",
  prc: "China", nz: "New Zealand",
};

export const normalizeCountry = (country) => {
  const value = String(country || "").trim().replace(/\s+/g, " ");
  if (!value) return value;
  const key = value.toLowerCase();
  return Object.prototype.hasOwnProperty.call(COUNTRY_ALIASES, key) ? COUNTRY_ALIASES[key] : value;
};

// Returns the listing with listingKind / category / subcategory / level filled
// in and `major` rewritten to the clean subcategory. Safe to call repeatedly.
export const normalizeListing = (item) => {
  if (!item) return item;
  const kind = detectKind(item);
  const keep = isValidPair(kind, item.category, item.subcategory);
  const subcategory = keep ? item.subcategory : kind === KIND_COMPANY ? inferCompany(item) : inferUniversity(item);
  const category = keep ? item.category : findGroupOf(kind, subcategory) || FALLBACK[kind].category;
  return {
    ...item,
    listingKind: kind,
    category,
    subcategory,
    major: subcategory,
    level: kind === KIND_UNIVERSITY ? normalizeLevel(item.level) : clean(item.level),
    country: normalizeCountry(item.country),
  };
};

export const normalizeListings = (items) => (Array.isArray(items) ? items.map(normalizeListing) : []);

export const filterByKind = (items, kind) =>
  normalizeListings(items).filter((item) => item.listingKind === kind);

// "Chemistry" under "Natural Sciences" -> "Natural Sciences › Chemistry"
export const categoryLabel = (item) =>
  item?.subcategory ? `${item.category} › ${item.subcategory}` : item?.major || "";

// Group name for a free-text value (a subcategory, a legacy major, a group).
export const groupForValue = (kind, value) => {
  const label = clean(value);
  if (!label) return "";
  if (getGroupNames(kind).includes(label)) return label;
  const listing = normalizeListing({ major: label, listingKind: kind, title: "", university: "" });
  return listing.category;
};

// Flat list of study fields (used by the profile's "field of study" picker).
// Flat list of study fields (used by the profile's "field of study" picker).
export const FIELD_OF_STUDY_OPTIONS = UNIVERSITY_CATEGORIES.flatMap((group) => group.subcategories).filter(
  (name) => name !== "General Studies" && !name.startsWith("General "),
);
