export type SchemeCategory =
  | "education"
  | "housing"
  | "employment"
  | "healthcare"
  | "women"
  | "agriculture"
  | "senior"
  | "business";

export interface DocumentRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  acceptedTypes: string[];
  maxSizeMB: number;
}

export interface Scheme {
  id: string;
  category: SchemeCategory;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  eligibility: string[];
  benefits: string;
  benefitAmount?: string;
  deadline: string;
  totalSlots: number;
  appliedCount: number;
  status: "open" | "closed" | "upcoming";
  processingDays: number;
  documents: DocumentRequirement[];
  image: string;
  launchDate: string;
  ministry: string;
  schemeCode: string;
}

const IMG = {
  grad:     "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop&auto=format",
  digital:  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop&auto=format",
  research: "https://images.unsplash.com/photo-1532094349884-543559957dfc?w=800&h=400&fit=crop&auto=format",
  faculty:  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop&auto=format",
  student:  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&auto=format",
  house:    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=400&fit=crop&auto=format",
  build:    "https://images.unsplash.com/photo-1503594384566-461fe158e797?w=800&h=400&fit=crop&auto=format",
  rental:   "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=400&fit=crop&auto=format",
  slum:     "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=400&fit=crop&auto=format",
  work:     "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop&auto=format",
  skill:    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=400&fit=crop&auto=format",
  job:      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop&auto=format",
  health:   "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop&auto=format",
  hosp:     "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=400&fit=crop&auto=format",
  women:    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop&auto=format",
  child:    "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&h=400&fit=crop&auto=format",
  farm:     "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=400&fit=crop&auto=format",
  crop:     "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop&auto=format",
  senior:   "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=400&fit=crop&auto=format",
  biz:      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop&auto=format",
  startup:  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop&auto=format",
};

const DOCS = {
  aadhar:     { id:"aadhar",     label:"Aadhaar Card",           description:"Government-issued 12-digit unique identity card.",            required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  pan:        { id:"pan",        label:"PAN Card",               description:"Permanent Account Number card issued by Income Tax Dept.",    required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  passport:   { id:"passport",   label:"Passport",               description:"Valid Indian Passport.",                                      required:false, acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:3 },
  income:     { id:"income",     label:"Income Certificate",     description:"Income certificate issued by revenue authority (< 6 months).", required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  caste:      { id:"caste",      label:"Caste Certificate",      description:"Caste certificate issued by competent authority.",            required:false, acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  residence:  { id:"residence",  label:"Residence Certificate",  description:"Proof of residence / domicile certificate.",                  required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  marksheet:  { id:"marksheet",  label:"Latest Mark Sheet",      description:"Official mark sheet from last qualifying examination.",       required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:3 },
  tc:         { id:"tc",         label:"Transfer Certificate",   description:"TC from last attended institution.",                          required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  bonafide:   { id:"bonafide",   label:"Bonafide Certificate",   description:"Bonafide student certificate from current institution.",      required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  bank:       { id:"bank",       label:"Bank Passbook / Statement", description:"Bank account passbook or 3-month statement.",             required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:3 },
  photo:      { id:"photo",      label:"Recent Photograph",      description:"Recent colour passport-size photograph (white background).",  required:true,  acceptedTypes:["image/jpeg","image/png"],                   maxSizeMB:1 },
  research:   { id:"research",   label:"Research Proposal",      description:"Detailed research proposal document.",                       required:true,  acceptedTypes:["application/pdf"],                         maxSizeMB:10 },
  pub:        { id:"pub",        label:"Publication List",       description:"List of publications / papers with proof.",                   required:false, acceptedTypes:["application/pdf"],                         maxSizeMB:5  },
  appoint:    { id:"appoint",    label:"Appointment Letter",     description:"Appointment letter from current institution.",                required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  emp_cert:   { id:"emp_cert",   label:"Employment Certificate", description:"Current employment certificate from employer.",              required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2 },
  payslip:    { id:"payslip",    label:"Salary Slip (last 3 months)", description:"Most recent 3 months pay slips.",                       required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:3 },
  land:       { id:"land",       label:"Land / Property Document", description:"Ownership or tenancy document for the property.",         required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:3 },
  house_plan: { id:"house_plan", label:"House Plan / Estimate",  description:"Approved building plan or cost estimate.",                   required:true,  acceptedTypes:["application/pdf"],                         maxSizeMB:5  },
  ration:     { id:"ration",     label:"Ration Card",            description:"Family ration card.",                                        required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  medical:    { id:"medical",    label:"Medical Certificate",    description:"Medical certificate from registered medical practitioner.",   required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  disability: { id:"disability", label:"Disability Certificate", description:"Certificate from medical board for disability.",             required:false, acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  skill_cert: { id:"skill_cert", label:"Skill / Training Certificate", description:"Proof of skill training or vocational certificate.",  required:false, acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  biz_plan:   { id:"biz_plan",   label:"Business Plan",          description:"Detailed business plan document.",                           required:true,  acceptedTypes:["application/pdf"],                         maxSizeMB:10 },
  gst:        { id:"gst",        label:"GST Registration",       description:"GST registration certificate (if applicable).",              required:false, acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  age_proof:  { id:"age_proof",  label:"Age Proof",              description:"Birth certificate or school leaving certificate.",           required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  widow:      { id:"widow",      label:"Widow / Divorcee Certificate", description:"Death certificate of spouse or divorce decree.",       required:false, acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  farmer:     { id:"farmer",     label:"Farmer ID / Kisan Card", description:"Kisan credit card or farmer registration document.",        required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:2  },
  crop_rec:   { id:"crop_rec",   label:"Crop Records / Pahani",  description:"Land records showing cultivated crops.",                     required:true,  acceptedTypes:["image/jpeg","image/png","application/pdf"], maxSizeMB:3  },
};

export const SCHEMES: Scheme[] = [
  // ── EDUCATION ──────────────────────────────────────────────────────────────
  {
    id:"edu-scholarship", category:"education", schemeCode:"EDU-SCH-001",
    ministry:"Ministry of Education",
    title:"Academic Excellence Scholarship",
    shortTitle:"Academic Excellence",
    description:"Full merit scholarship for outstanding students in undergraduate programmes at recognised universities.",
    longDescription:"The Academic Excellence Scholarship is awarded to students who have achieved exceptional academic results in their qualifying examination. Awardees receive a monthly stipend, tuition fee waiver, and access to a mentorship network. The scheme is open to students enrolled in any government or government-aided institution across India.",
    eligibility:["Age: 17–25 years","Secured 85% or above in qualifying exam","Family annual income below ₹8 lakh","Enrolled full-time in UG programme","Indian citizen with domicile proof"],
    benefits:"Monthly stipend of ₹5,000 + full tuition fee waiver + laptop grant of ₹25,000",
    benefitAmount:"₹5,000/month + ₹25,000 one-time",
    deadline:"31 March 2026", launchDate:"01 January 2026",
    totalSlots:5000, appliedCount:3847, status:"open", processingDays:30,
    image: IMG.grad,
    documents:[DOCS.aadhar,DOCS.income,DOCS.marksheet,DOCS.bonafide,DOCS.bank,DOCS.photo,DOCS.residence,DOCS.caste],
  },
  {
    id:"edu-digital", category:"education", schemeCode:"EDU-DLI-002",
    ministry:"Ministry of Electronics & IT",
    title:"Digital Learning Initiative",
    shortTitle:"Digital Learning",
    description:"Provides free digital devices and high-speed internet connectivity to economically weaker students.",
    longDescription:"The Digital Learning Initiative bridges the digital divide by providing eligible students with a tablet or laptop pre-loaded with educational content, along with 12 months of free internet connectivity. The scheme prioritises first-generation learners and students from rural areas.",
    eligibility:["Enrolled in Class 9 or above / UG / PG","Family income below ₹3 lakh per annum","No existing smart device in household","Studying in government / aided institution","Indian citizen"],
    benefits:"Free tablet/laptop + 12-month internet data pack (30 GB/month)",
    benefitAmount:"Device worth ₹22,000 + ₹3,600 connectivity",
    deadline:"28 February 2026", launchDate:"01 November 2025",
    totalSlots:100000, appliedCount:78432, status:"open", processingDays:21,
    image: IMG.digital,
    documents:[DOCS.aadhar,DOCS.income,DOCS.bonafide,DOCS.ration,DOCS.bank,DOCS.photo],
  },
  {
    id:"edu-achievement", category:"education", schemeCode:"EDU-SAS-003",
    ministry:"Ministry of Education",
    title:"Student Achievement Scheme",
    shortTitle:"Student Achievement",
    description:"Recognises and rewards students who have excelled in sports, arts, science olympiads, or community service.",
    longDescription:"The Student Achievement Scheme celebrates holistic excellence beyond academics. Students who have represented the state or country in sports, won national-level arts competitions, secured positions in Science Olympiads, or demonstrated outstanding community service are eligible for a one-time award and scholarship.",
    eligibility:["Age 14–22 years","Achievement proof at state / national / international level","Enrolled in a recognised institution","Indian citizen","Not a recipient of any other central scholarship"],
    benefits:"One-time award of ₹50,000 + certificate of merit + skill development access",
    benefitAmount:"₹50,000 one-time award",
    deadline:"15 April 2026", launchDate:"01 December 2025",
    totalSlots:2000, appliedCount:1234, status:"open", processingDays:45,
    image: IMG.student,
    documents:[DOCS.aadhar,DOCS.age_proof,DOCS.bonafide,DOCS.marksheet,DOCS.photo,{id:"achieve",label:"Achievement Certificate / Medal",description:"Proof of achievement: certificate, medal, or newspaper clipping.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:5}],
  },
  {
    id:"edu-faculty", category:"education", schemeCode:"EDU-FES-004",
    ministry:"Ministry of Education",
    title:"Faculty Excellence Scheme",
    shortTitle:"Faculty Excellence",
    description:"Annual fellowship for outstanding faculty members in higher education to pursue advanced research and professional development.",
    longDescription:"The Faculty Excellence Scheme is designed to attract and retain high-quality faculty in India's higher education institutions. Awardees receive a research fellowship, funding for international conference attendance, and access to collaborative research networks. Candidates are evaluated on teaching record, publications, and research impact.",
    eligibility:["Permanent faculty in a government institution","PhD holder with minimum 3 years teaching experience","At least 2 peer-reviewed publications in last 3 years","Age below 55 years","Indian citizen"],
    benefits:"Research grant of ₹2 lakh/year + conference funding ₹1 lakh + 2-year fellowship",
    benefitAmount:"₹3 lakh/year for 2 years",
    deadline:"30 June 2026", launchDate:"01 February 2026",
    totalSlots:500, appliedCount:312, status:"open", processingDays:60,
    image: IMG.faculty,
    documents:[DOCS.aadhar,DOCS.pan,DOCS.appoint,DOCS.pub,DOCS.research,DOCS.photo,{id:"teach_rec",label:"Teaching Record",description:"Evidence of teaching experience (5 years).",required:true,acceptedTypes:["application/pdf"],maxSizeMB:5}],
  },
  {
    id:"edu-innovation", category:"education", schemeCode:"EDU-IRS-005",
    ministry:"Department of Science & Technology",
    title:"Innovation and Research Support",
    shortTitle:"Innovation & Research",
    description:"Funding support for students and researchers pursuing novel scientific and technological innovations.",
    longDescription:"The Innovation and Research Support scheme provides seed funding, laboratory access, and mentorship to students and early-career researchers with promising innovation ideas. Projects are evaluated for novelty, feasibility, societal impact, and scalability. Successful projects may qualify for additional commercialisation support.",
    eligibility:["Enrolled in PG / PhD programme or within 2 years of graduation","Original research idea with proof of concept","Institution must be NAAC or NBA accredited","Indian citizen or OCI cardholder","Age below 35 years"],
    benefits:"Seed funding ₹2–10 lakh + lab access + IP filing support + incubation access",
    benefitAmount:"₹2–10 lakh (project dependent)",
    deadline:"31 May 2026", launchDate:"01 January 2026",
    totalSlots:300, appliedCount:198, status:"open", processingDays:90,
    image: IMG.research,
    documents:[DOCS.aadhar,DOCS.bonafide,DOCS.research,DOCS.marksheet,DOCS.bank,DOCS.photo,{id:"poc",label:"Proof of Concept / Prototype",description:"Video, images, or report showing your prototype.",required:false,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:10}],
  },

  // ── HOUSING ────────────────────────────────────────────────────────────────
  {
    id:"house-pmay", category:"housing", schemeCode:"HSG-PMAY-001",
    ministry:"Ministry of Housing & Urban Affairs",
    title:"Pradhan Mantri Awas Yojana (Urban)",
    shortTitle:"PMAY Urban",
    description:"Interest subsidy and financial assistance for construction or purchase of pucca houses for urban poor.",
    longDescription:"PMAY (Urban) aims to provide affordable housing to all urban households by 2026. Eligible beneficiaries receive credit-linked interest subsidy on home loans, direct financial assistance, or in-situ slum rehabilitation. The scheme covers four categories: EWS, LIG, MIG-I, and MIG-II based on annual household income.",
    eligibility:["Family must not own a pucca house anywhere in India","Annual family income: EWS ≤ ₹3L, LIG ≤ ₹6L, MIG-I ≤ ₹12L, MIG-II ≤ ₹18L","Female beneficiary preferred as primary owner","Urban area resident","Aadhaar-linked bank account"],
    benefits:"Interest subsidy 3–6.5% on home loan + up to ₹2.5 lakh direct grant (EWS/LIG)",
    benefitAmount:"Up to ₹2.5 lakh grant + interest subsidy",
    deadline:"31 December 2026", launchDate:"01 June 2015",
    totalSlots:2000000, appliedCount:1654322, status:"open", processingDays:60,
    image: IMG.house,
    documents:[DOCS.aadhar,DOCS.pan,DOCS.income,DOCS.bank,DOCS.ration,DOCS.residence,DOCS.land,DOCS.photo,{id:"affidavit",label:"Affidavit of No Pucca House",description:"Notarised affidavit declaring no pucca house ownership.",required:true,acceptedTypes:["application/pdf"],maxSizeMB:3}],
  },
  {
    id:"house-rural", category:"housing", schemeCode:"HSG-PMGAY-002",
    ministry:"Ministry of Rural Development",
    title:"Pradhan Mantri Gramin Awaas Yojana",
    shortTitle:"PMGAY (Rural)",
    description:"Financial assistance to rural BPL households for construction of a safe and durable pucca house.",
    longDescription:"PMGAY provides financial assistance of ₹1.2 lakh (plain) and ₹1.3 lakh (hilly / difficult areas) to rural BPL families for construction of a pucca house with basic amenities — toilet, clean cooking fuel, and electricity connection. Houses are geo-tagged and monitored through the AwaasSoft platform.",
    eligibility:["Rural household listed in SECC 2011","BPL card holder","No existing pucca house","Not previously benefited from any central housing scheme","Must complete construction within 12 months"],
    benefits:"₹1.2 lakh (plain) / ₹1.3 lakh (hilly area) grant + MGNREGS wages for construction",
    benefitAmount:"₹1.2–1.3 lakh grant",
    deadline:"Ongoing", launchDate:"20 November 2016",
    totalSlots:5000000, appliedCount:4123456, status:"open", processingDays:45,
    image: IMG.build,
    documents:[DOCS.aadhar,DOCS.income,DOCS.ration,DOCS.bank,DOCS.land,DOCS.residence,DOCS.photo,{id:"secc",label:"SECC 2011 Entry Proof",description:"SECC 2011 beneficiary list printout or certificate.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:2}],
  },
  {
    id:"house-rental", category:"housing", schemeCode:"HSG-AHP-003",
    ministry:"Ministry of Housing & Urban Affairs",
    title:"Affordable Rental Housing Complexes",
    shortTitle:"Rental Housing",
    description:"Subsidised rental accommodation for migrant workers and urban poor near workplaces.",
    longDescription:"The Affordable Rental Housing Complexes (ARHC) scheme converts existing government-funded housing into rental housing stock for urban migrants and economically weaker sections. Beneficiaries can access safe, hygienic accommodation at affordable rents near their workplaces.",
    eligibility:["Migrant worker or urban poor with income ≤ ₹3 lakh/year","Not owning any residential property in the city","Employed or seeking employment in the city","Aadhaar-linked mobile number","No existing government housing allotment"],
    benefits:"Subsidised rent (20–25% below market rate) + basic civic amenities",
    benefitAmount:"Subsidised rent — savings of ₹2,000–5,000/month",
    deadline:"31 March 2026", launchDate:"01 July 2020",
    totalSlots:200000, appliedCount:87654, status:"open", processingDays:30,
    image: IMG.rental,
    documents:[DOCS.aadhar,DOCS.income,DOCS.emp_cert,DOCS.bank,DOCS.photo,DOCS.residence],
  },
  {
    id:"house-slum", category:"housing", schemeCode:"HSG-SRD-004",
    ministry:"Ministry of Housing & Urban Affairs",
    title:"Slum Rehabilitation and Development",
    shortTitle:"Slum Rehabilitation",
    description:"In-situ rehabilitation of slum dwellers with free pucca housing units within the same locality.",
    longDescription:"Under the Slum Rehabilitation scheme, identified slum dwellers receive a fully constructed pucca house of minimum 30 sq mt carpet area at their existing location. A portion of the land is used for cross-subsidised housing to fund construction, making the scheme financially self-sustaining.",
    eligibility:["Slum resident since before 2000","Possession certificate or voter ID showing slum address","Not a beneficiary of any previous rehabilitation scheme","Aadhaar-linked household","Agreement to vacate during construction period"],
    benefits:"Free pucca house unit (30+ sq mt) + basic amenities at no cost",
    benefitAmount:"Free housing unit worth ₹8–15 lakh",
    deadline:"31 December 2027", launchDate:"01 April 2022",
    totalSlots:500000, appliedCount:234567, status:"open", processingDays:90,
    image: IMG.slum,
    documents:[DOCS.aadhar,DOCS.ration,DOCS.residence,DOCS.bank,DOCS.photo,{id:"poss_cert",label:"Possession Certificate",description:"Any document proving slum residence before 2000.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:3}],
  },

  // ── EMPLOYMENT ─────────────────────────────────────────────────────────────
  {
    id:"emp-pmkvy", category:"employment", schemeCode:"EMP-PMKVY-001",
    ministry:"Ministry of Skill Development & Entrepreneurship",
    title:"Pradhan Mantri Kaushal Vikas Yojana",
    shortTitle:"PMKVY 4.0",
    description:"Free short-term skill training with industry-recognised certification to enhance employability.",
    longDescription:"PMKVY 4.0 provides industry-relevant short-duration skill training (15 days to 3 months) across 300+ job roles in 30+ sectors. Candidates who pass the final assessment receive a government-recognised certificate and a monetary reward. The scheme includes RPL (Recognition of Prior Learning) for experienced workers.",
    eligibility:["Indian citizen aged 15–45 years","Class 8 pass minimum (for most courses)","Aadhaar-linked bank account","Unemployed or seeking upgrade in skills","Not currently enrolled in full-time education"],
    benefits:"Free training + certification + ₹500–8,000 post-assessment reward + placement support",
    benefitAmount:"₹500–8,000 reward",
    deadline:"31 March 2026", launchDate:"15 July 2015",
    totalSlots:1400000, appliedCount:1134567, status:"open", processingDays:7,
    image: IMG.skill,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.photo,DOCS.age_proof,{id:"qual_cert",label:"Qualification Certificate",description:"Highest education qualification certificate.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:3}],
  },
  {
    id:"emp-mgnregs", category:"employment", schemeCode:"EMP-MGNR-002",
    ministry:"Ministry of Rural Development",
    title:"Mahatma Gandhi National Rural Employment Guarantee",
    shortTitle:"MGNREGS",
    description:"Guarantees 100 days of unskilled wage employment per year to every rural household.",
    longDescription:"MGNREGS provides legally mandated employment guarantee to rural households. Any rural adult who registers and demands work must be provided unskilled manual work within 15 days, failing which an unemployment allowance is paid. Wages are paid directly to bank/post office accounts within 15 days of work completion.",
    eligibility:["Rural household","Adult member (18+ years) willing to do unskilled manual work","Resident of the Gram Panchayat where registered","Aadhaar-linked bank/post office account","Job card holder"],
    benefits:"100 days guaranteed wage employment at ₹202–333/day (state-specific) + unemployment allowance",
    benefitAmount:"₹202–333/day × up to 100 days",
    deadline:"Ongoing — perpetual entitlement", launchDate:"02 February 2006",
    totalSlots:9999999, appliedCount:5634789, status:"open", processingDays:15,
    image: IMG.work,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.ration,DOCS.photo,{id:"job_card",label:"Job Card",description:"MGNREGS Job Card (if existing) or ward certificate.",required:false,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:2}],
  },
  {
    id:"emp-startup", category:"employment", schemeCode:"EMP-SUR-003",
    ministry:"Ministry of Commerce & Industry",
    title:"Startup India Seed Fund Scheme",
    shortTitle:"Startup India",
    description:"Seed funding support for early-stage startups to validate proof of concept and prototype development.",
    longDescription:"The Startup India Seed Fund Scheme (SISFS) provides financial assistance to startups for proof of concept, prototype development, product trials, and market entry. Grants are disbursed through incubators registered under DPIIT across India. Startups can receive grants up to ₹20 lakh for validation and up to ₹50 lakh as investable instruments.",
    eligibility:["DPIIT-recognised startup","Incorporated within last 2 years","Not received > ₹10 lakh in grant from central/state schemes","No investments from VC / angel networks","Graduate or PG degree holder founders preferred"],
    benefits:"Up to ₹20 lakh grant (validation) + up to ₹50 lakh investable instrument",
    benefitAmount:"₹20–50 lakh",
    deadline:"31 December 2026", launchDate:"19 April 2021",
    totalSlots:3600, appliedCount:2145, status:"open", processingDays:60,
    image: IMG.startup,
    documents:[DOCS.aadhar,DOCS.pan,DOCS.bank,DOCS.biz_plan,DOCS.gst,{id:"dpiit",label:"DPIIT Recognition Certificate",description:"DPIIT startup recognition certificate.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:3},{id:"incorp",label:"Incorporation Certificate",description:"MCA certificate of incorporation.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:3}],
  },
  {
    id:"emp-pm-rozgar", category:"employment", schemeCode:"EMP-PMRY-004",
    ministry:"Ministry of MSME",
    title:"PM MUDRA Yojana — Shishu Loan",
    shortTitle:"MUDRA Shishu",
    description:"Collateral-free micro loans up to ₹50,000 for small businesses and self-employment ventures.",
    longDescription:"PM MUDRA Yojana enables micro and small enterprises to access institutional credit without collateral. The Shishu category (up to ₹50,000) supports new entrepreneurs setting up small businesses, street vendors, artisans, and self-employed workers who do not qualify for traditional bank loans.",
    eligibility:["Indian citizen 18–60 years","Self-employed / small business owner or aspirant","Not a defaulter in any bank or NBFC","Business activity in manufacturing, trading, or services","Annual income below ₹5 lakh"],
    benefits:"Collateral-free loan up to ₹50,000 at subsidised interest + MUDRA card",
    benefitAmount:"Loan up to ₹50,000",
    deadline:"Ongoing", launchDate:"08 April 2015",
    totalSlots:9999999, appliedCount:3234567, status:"open", processingDays:14,
    image: IMG.biz,
    documents:[DOCS.aadhar,DOCS.pan,DOCS.bank,DOCS.photo,DOCS.biz_plan,DOCS.residence,{id:"biz_proof",label:"Business Proof",description:"Shop license, trade license, or self-declaration.",required:false,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:2}],
  },

  // ── HEALTHCARE ─────────────────────────────────────────────────────────────
  {
    id:"health-pmjay", category:"healthcare", schemeCode:"HLT-PMJAY-001",
    ministry:"Ministry of Health & Family Welfare",
    title:"Ayushman Bharat PM-JAY",
    shortTitle:"Ayushman Bharat",
    description:"Health cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation.",
    longDescription:"Ayushman Bharat PM-JAY is the world's largest government-funded health insurance scheme. Eligible families (SECC 2011 identified) receive a health cover of ₹5 lakh per year for secondary and tertiary care hospitalisation. Over 1,929 medical procedures are covered across 10,000+ empanelled hospitals.",
    eligibility:["Identified in SECC 2011 database","Deprivation and occupational criteria met","No existing private health insurance","Aadhaar or ration card available","BPL or targeted family"],
    benefits:"₹5 lakh/year cashless hospitalisation at any empanelled hospital (public or private)",
    benefitAmount:"₹5 lakh/family/year",
    deadline:"Ongoing", launchDate:"23 September 2018",
    totalSlots:50000000, appliedCount:45678234, status:"open", processingDays:7,
    image: IMG.health,
    documents:[DOCS.aadhar,DOCS.ration,DOCS.income,DOCS.bank,DOCS.photo,{id:"secc_h",label:"SECC Verification Letter",description:"Letter confirming SECC 2011 beneficiary status.",required:false,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:2}],
  },
  {
    id:"health-janani", category:"healthcare", schemeCode:"HLT-JSY-002",
    ministry:"Ministry of Health & Family Welfare",
    title:"Janani Suraksha Yojana",
    shortTitle:"Janani Suraksha",
    description:"Cash assistance to pregnant women for institutional delivery to reduce maternal and neonatal mortality.",
    longDescription:"JSY promotes safe motherhood by providing cash incentives for institutional delivery at public health centres. BPL pregnant women in rural areas receive ₹1,400 and urban BPL women receive ₹1,000 on delivery. ASHA workers facilitating delivery receive an additional incentive.",
    eligibility:["Pregnant woman of any age","BPL or SC/ST household (LPS states)","Any pregnant woman in LPS (low-performance) states","Delivery at government or accredited private health facility","Aadhaar-linked bank account"],
    benefits:"₹1,400 (rural) / ₹1,000 (urban) cash transfer on institutional delivery",
    benefitAmount:"₹1,000–1,400 per delivery",
    deadline:"Ongoing", launchDate:"12 April 2005",
    totalSlots:9999999, appliedCount:2345678, status:"open", processingDays:7,
    image: IMG.hosp,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.ration,DOCS.income,DOCS.photo,DOCS.medical,{id:"preg_reg",label:"Pregnancy Registration Card",description:"ANC registration card from government health centre.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:2}],
  },

  // ── WOMEN & CHILDREN ───────────────────────────────────────────────────────
  {
    id:"women-beti", category:"women", schemeCode:"WMN-BBBP-001",
    ministry:"Ministry of Women & Child Development",
    title:"Beti Bachao Beti Padhao",
    shortTitle:"Beti Bachao",
    description:"Welfare and education assistance for the girl child in districts with low Child Sex Ratio.",
    longDescription:"BBBP addresses the decline in child sex ratio and promotes welfare, protection, and education of the girl child. Financial incentives are provided on the birth of a girl child, with additional benefits on completion of school stages. The scheme also provides scholarship for higher education.",
    eligibility:["Resident of a BBBP target district","Girl child born in the family","Family income below ₹5 lakh/year","Not previously received benefit under the scheme","Institutional delivery (preferred)"],
    benefits:"₹2,000 on birth + ₹5,000 on Class 6 admission + ₹7,000 on Class 9 + scholarship for college",
    benefitAmount:"Up to ₹14,000 staged benefits + scholarship",
    deadline:"Ongoing", launchDate:"22 January 2015",
    totalSlots:9999999, appliedCount:4567890, status:"open", processingDays:21,
    image: IMG.women,
    documents:[DOCS.aadhar,DOCS.income,DOCS.bank,DOCS.ration,DOCS.photo,DOCS.age_proof,{id:"birth_cert",label:"Child's Birth Certificate",description:"Certified birth certificate of the girl child.",required:true,acceptedTypes:["image/jpeg","image/png","application/pdf"],maxSizeMB:2}],
  },
  {
    id:"women-widow", category:"women", schemeCode:"WMN-NWS-002",
    ministry:"Ministry of Women & Child Development",
    title:"National Widow Support Scheme",
    shortTitle:"Widow Support",
    description:"Monthly pension and livelihood support for widows and single women below the poverty line.",
    longDescription:"The National Widow Support Scheme provides monthly pension, skill training, and priority access to government schemes for widows and single women in distress. Beneficiaries also receive assistance for children's education and priority in housing allocation.",
    eligibility:["Widow or deserted woman aged 18–79 years","Annual family income below ₹2 lakh","BPL card holder","Aadhaar-linked bank account","Not receiving pension from any other scheme"],
    benefits:"₹300–500/month pension + priority scheme access + skill training",
    benefitAmount:"₹300–500/month",
    deadline:"Ongoing", launchDate:"01 April 1995",
    totalSlots:9999999, appliedCount:1234567, status:"open", processingDays:30,
    image: IMG.child,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.income,DOCS.ration,DOCS.photo,DOCS.widow,DOCS.age_proof],
  },

  // ── AGRICULTURE ────────────────────────────────────────────────────────────
  {
    id:"agri-pmkisan", category:"agriculture", schemeCode:"AGR-PMK-001",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    title:"PM Kisan Samman Nidhi",
    shortTitle:"PM-KISAN",
    description:"Direct income support of ₹6,000 per year to small and marginal farmers in three equal instalments.",
    longDescription:"PM-KISAN provides income support to farmers whose names appear in land records. The benefit of ₹2,000 is transferred directly to the Aadhaar-linked bank account in three instalments per year. Small farmers can use this to meet agricultural input costs and household needs.",
    eligibility:["Small or marginal farmer with cultivable land","Name in land records (Pahani/RoR)","Aadhaar-linked bank account","Not an income tax payer","Not a retired government employee with pension > ₹10,000/month"],
    benefits:"₹6,000/year in 3 instalments of ₹2,000 directly to bank account",
    benefitAmount:"₹6,000/year (₹2,000 × 3 instalments)",
    deadline:"Ongoing", launchDate:"24 February 2019",
    totalSlots:9999999, appliedCount:8967432, status:"open", processingDays:14,
    image: IMG.farm,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.land,DOCS.farmer,DOCS.photo,DOCS.income],
  },
  {
    id:"agri-fasal", category:"agriculture", schemeCode:"AGR-PMFBY-002",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    title:"Pradhan Mantri Fasal Bima Yojana",
    shortTitle:"Fasal Bima",
    description:"Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities.",
    longDescription:"PMFBY provides comprehensive risk insurance cover for pre-sowing to post-harvest losses due to natural calamities, pests, and diseases. Farmers pay a very low premium (1.5–2% of sum insured for Kharif / Rabi crops) while the government subsidises the remainder. Claims are settled within 60 days.",
    eligibility:["Farmer with notified crop in notified area","Cultivating own or leased land","Enrolled before cut-off date for the season","Aadhaar-linked bank account","Must pay applicable farmer premium"],
    benefits:"Full insurance cover against crop loss + premium subsidy",
    benefitAmount:"Sum insured varies by crop (₹15,000–2,00,000/hectare)",
    deadline:"Season-based (Kharif: 31 July / Rabi: 31 Dec)", launchDate:"18 February 2016",
    totalSlots:9999999, appliedCount:5678901, status:"open", processingDays:30,
    image: IMG.crop,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.land,DOCS.farmer,DOCS.crop_rec,DOCS.photo],
  },

  // ── SENIOR CITIZENS ────────────────────────────────────────────────────────
  {
    id:"senior-ignoaps", category:"senior", schemeCode:"SEN-IGNOAPS-001",
    ministry:"Ministry of Rural Development",
    title:"Indira Gandhi National Old Age Pension",
    shortTitle:"Old Age Pension",
    description:"Monthly pension for BPL senior citizens aged 60 years and above.",
    longDescription:"IGNOAPS provides monthly pension to BPL individuals aged 60 years and above. The central contribution is ₹200/month for 60–79 years and ₹500/month for 80+ years. State governments are encouraged to add a top-up. Pension is credited directly to the beneficiary's Aadhaar-linked account.",
    eligibility:["Age 60 years or above","BPL household","Aadhaar-linked bank account","Indian citizen","Not receiving pension from any government source"],
    benefits:"₹200/month (60–79 years) / ₹500/month (80+ years) + state top-up",
    benefitAmount:"₹200–500/month (central) + state top-up",
    deadline:"Ongoing", launchDate:"01 April 1995",
    totalSlots:9999999, appliedCount:3456789, status:"open", processingDays:30,
    image: IMG.senior,
    documents:[DOCS.aadhar,DOCS.bank,DOCS.age_proof,DOCS.income,DOCS.ration,DOCS.photo],
  },

  // ── BUSINESS ───────────────────────────────────────────────────────────────
  {
    id:"biz-stand-up", category:"business", schemeCode:"BIZ-SUP-001",
    ministry:"Ministry of Finance / SIDBI",
    title:"Stand-Up India Scheme",
    shortTitle:"Stand-Up India",
    description:"Bank loans from ₹10 lakh to ₹1 crore for SC/ST and women entrepreneurs setting up greenfield enterprises.",
    longDescription:"Stand-Up India facilitates bank loans to at least one SC or ST borrower and one woman borrower per bank branch for setting up a greenfield enterprise (manufacturing, services, trading, or agri-allied activities). The scheme also provides handholding support and credit guarantee through NCGTC.",
    eligibility:["SC/ST entrepreneur or woman entrepreneur","Age 18+ years","First-time entrepreneur (greenfield enterprise)","Not a defaulter in any scheduled commercial bank","Business in manufacturing, services, or trading sector"],
    benefits:"Composite loan ₹10 lakh – ₹1 crore + credit guarantee + handholding",
    benefitAmount:"₹10 lakh – ₹1 crore loan",
    deadline:"Ongoing", launchDate:"05 April 2016",
    totalSlots:125000, appliedCount:78432, status:"open", processingDays:30,
    image: IMG.biz,
    documents:[DOCS.aadhar,DOCS.pan,DOCS.bank,DOCS.caste,DOCS.biz_plan,DOCS.photo,DOCS.gst,{id:"proj_rep",label:"Project Report",description:"Detailed project/feasibility report.",required:true,acceptedTypes:["application/pdf"],maxSizeMB:10}],
  },
];

export const CATEGORIES: Record<SchemeCategory, { label: string; icon: string; description: string }> = {
  education:  { label:"Education",      icon:"graduation-cap", description:"Scholarships, fellowships, and learning initiatives" },
  housing:    { label:"Housing",        icon:"home",           description:"Home construction, rental, and rehabilitation" },
  employment: { label:"Employment",     icon:"briefcase",      description:"Skill training, job creation, and entrepreneurship" },
  healthcare: { label:"Healthcare",     icon:"heart",          description:"Medical insurance, maternal health, and wellness" },
  women:      { label:"Women & Child",  icon:"users",          description:"Welfare schemes for women and children" },
  agriculture:{ label:"Agriculture",   icon:"leaf",           description:"Farmer support, crop insurance, and income aid" },
  senior:     { label:"Senior Citizens",icon:"shield",         description:"Pensions and welfare for elderly citizens" },
  business:   { label:"Business",      icon:"trending-up",    description:"Loans and support for entrepreneurs and MSMEs" },
};
