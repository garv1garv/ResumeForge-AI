import { GoogleGenAI } from "@google/genai";

let ai = null;

export function initGemini(apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// ===== RETRY HELPER (DRY — used by all Gemini calls) =====
async function callWithRetry(fn, { retries = 3, delayMs = 2000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errMsg = error.message || JSON.stringify(error) || "";
      const isOverloaded =
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("high demand") ||
        error.status === 503 ||
        error.status === "UNAVAILABLE";

      if (isOverloaded && attempt < retries - 1) {
        console.warn(
          `Gemini API overloaded [503]. Retrying in ${delayMs / 1000}s... (attempt ${attempt + 1}/${retries})`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 1.5; // Exponential backoff
      } else if (isOverloaded) {
        throw new Error(
          "Gemini AI is currently experiencing high demand. Please wait a few seconds and try again."
        );
      } else {
        throw new Error("Error communicating with Gemini AI: " + errMsg);
      }
    }
  }
  throw lastError;
}

// ===== SAFE TEXT EXTRACTION =====
function extractResponseText(response) {
  const text = (
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.text ||
    ""
  ).trim();
  if (!text) {
    throw new Error(
      "Gemini returned an empty response. Please try again."
    );
  }
  return text;
}

// ===== JSON PARSING WITH DEBUG LOGGING =====
function parseJSONResponse(rawText) {
  let cleanText = rawText;
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.slice(0, -3);
  }
  cleanText = cleanText.trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // Log the first 500 chars so you can debug what Gemini actually returned
    console.error(
      "Failed to parse Gemini JSON response. First 500 chars:",
      cleanText.substring(0, 500)
    );
    throw new Error(
      "Failed to parse AI response as JSON. The AI may have returned malformed output. Please try again."
    );
  }
}

// ===== PRE-PROCESS GITHUB PROJECTS =====
function cleanGitHubProjects(projects) {
  return projects.map((p) => ({
    name: p.name,
    description: p.description || "No description",
    language: p.language,
    topics: p.topics || [],
    url: p.url || p.html_url,
  }));
}

// ===== PASS 1: EXTRACT RAW DATA FROM PDF =====
const EXTRACT_PROMPT = `You are a precise data extraction system. Your ONLY job is to extract information from the attached PDF resume.

RULES:
- Extract EXACTLY what is written in the PDF. Do NOT rephrase, improve, or add anything.
- If a field is not present in the PDF, use an empty string or empty array.
- Do NOT invent, infer, or guess any skills, experiences, or achievements.
- Extract ALL links (LinkedIn, GitHub, portfolio, project links, etc.)

Return a JSON object with this EXACT structure:
{
  "contact": {
    "name": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "summary": "Exact summary text from resume, or empty string if none",
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "domains": []
  },
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "highlights": ["Exact bullet points from resume"]
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "Exact description from resume",
      "technologies": [],
      "link": "",
      "highlights": ["Exact bullet points from resume"]
    }
  ],
  "education": [
    {
      "degree": "",
      "school": "",
      "location": "",
      "graduationDate": "",
      "gpa": "",
      "highlights": []
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "link": ""
    }
  ]
}

Return ONLY valid JSON. No markdown fences, no extra text.`;

// ===== PASS 2: REWRITE USING VERIFIED DATA + JD =====
const REWRITE_PROMPT = (rawData, jobDescription, githubProjects) => `You are an elite resume writer. You have been given VERIFIED raw data extracted from a candidate's resume, plus a job description they are targeting.

VERIFIED CANDIDATE DATA (this is the ONLY source of truth — you cannot add anything not here):
---
${JSON.stringify(rawData, null, 2)}
---

TARGET JOB DESCRIPTION:
---
${jobDescription}
---

${githubProjects.length > 0 ? `CANDIDATE'S GITHUB PROJECTS (real projects — use relevant ones):\n---\n${JSON.stringify(githubProjects, null, 2)}\n---` : ""}

YOUR TASK:
Rewrite the resume content to align with the job description while following these strict rules.

CRITICAL RULES — WHAT YOU CANNOT DO:
1. NEVER fabricate companies, schools, names, dates, or job titles
2. NEVER add skills that are NOT in the verified data above
3. NEVER invent metrics — if the original bullet has no metric, write a strong qualitative bullet instead
4. If a skill appears in the JD but NOT in the verified data, put it in the "skillGaps" array — do NOT add it to skills

BULLET POINT RULES — STRICT:
BAD: "Worked on backend systems to improve performance"
GOOD: "Reduced API response time by 40% by implementing Redis caching layer"

BAD: "Responsible for developing features"
GOOD: "Engineered 3 core product features in Node.js used by 10,000+ daily active users"

Every bullet MUST follow: ACTION VERB + WHAT YOU DID + MEASURABLE RESULT
If the original bullet has a metric, keep it. If not, rewrite with strong qualitative impact — do NOT invent numbers.
Never write a bullet without a concrete result.

SUMMARY RULES — STRICT:
Write a summary with EXACTLY this structure:
Sentence 1: [Seniority] [role type] with [X years/specific experience] in [specific domain from their background].
Sentence 2: Built/Led/Engineered [specific achievement from their verified data] achieving [specific result].
Sentence 3: Seeking to bring [specific relevant skill from their data] to [specific thing from the JD].

BANNED WORDS in summary: "passionate", "seeking opportunities", "track record", "leverage", "synergy", "results-driven", "detail-oriented", "team player", "fast-paced", "cutting-edge"

SKILLS ORDERING RULES:
1. Count how many times each skill appears in the JD (exact + synonyms)
2. Order skills by that frequency — highest first
3. If a skill appears in "Required" section of JD, it goes before "Nice to have" skills
4. ONLY include skills that exist in the verified candidate data
5. Categorize into: languages, frameworks, tools, domains

PROJECT SELECTION RULES:
- Maximum 4 projects in the output
- Score each project 1-10 for relevance to the JD
- Only include projects scoring 5+
- If fewer than 2 projects score 5+, include the highest scoring ones anyway
- If GitHub projects are provided and relevant, include them
- Rewrite descriptions to highlight JD relevance

Return a JSON object with this EXACT structure:
{
  "contact": {
    "name": "Real Name",
    "title": "Professional Title tailored to the job",
    "email": "real@email.com",
    "phone": "real phone",
    "location": "Real Location",
    "linkedin": "real linkedin url or empty string",
    "github": "real github url or empty string",
    "portfolio": "real portfolio url or empty string"
  },
  "summary": "Structured summary following the rules above",
  "skills": {
    "languages": ["Only skills from verified data, ordered by JD relevance"],
    "frameworks": ["Only frameworks from verified data"],
    "tools": ["Only tools from verified data"],
    "domains": ["Only domains from verified data"]
  },
  "experience": [
    {
      "title": "Real Job Title",
      "company": "Real Company",
      "location": "Real Location",
      "startDate": "Real Start Date",
      "endDate": "Real End Date",
      "highlights": [
        "Rewritten bullet following ACTION VERB + WHAT + RESULT format"
      ]
    }
  ],
  "projects": [
    {
      "name": "Real Project Name",
      "description": "Rewritten to show JD relevance",
      "technologies": ["Real", "Tech", "Used"],
      "link": "real link or empty string",
      "highlights": ["Rewritten with impact"]
    }
  ],
  "education": [
    {
      "degree": "Real Degree",
      "school": "Real University",
      "location": "Real Location",
      "graduationDate": "Real Date",
      "gpa": "Real GPA if available",
      "highlights": ["Real coursework/honors relevant to the job"]
    }
  ],
  "certifications": [
    {
      "name": "Real Certification",
      "issuer": "Real Issuer",
      "date": "Real Date",
      "link": "Real link or empty string"
    }
  ],
  "keywordAnalysis": {
    "keywordsMatched": ["Skills/keywords from JD that ARE in the resume"],
    "keywordsMissing": ["Skills/keywords from JD that are NOT in the verified data"],
    "skillGaps": ["Actionable recommendations like: Consider adding Kubernetes if you have exposure"],
    "improvements": ["What was changed and why, e.g. Added metrics to 4 experience bullets"]
  }
}

CRITICAL: Return ONLY valid JSON. No markdown fences, no extra text. Keep resume to 1-2 pages of content.`;

// ===== CLIENT-SIDE ATS SCORING =====
export function computeATSScore(resumeJSON, jobDescriptionText) {
  if (!jobDescriptionText || !resumeJSON) return null;

  // Extract all meaningful words from JD (lowercase, deduplicated)
  const jdText = jobDescriptionText.toLowerCase();
  const jdWords = jdText
    .replace(/[^a-z0-9+#.\-\/\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Build keyword frequency map from JD
  const jdKeywordFreq = {};
  jdWords.forEach((w) => {
    jdKeywordFreq[w] = (jdKeywordFreq[w] || 0) + 1;
  });

  // Extract all text from resume JSON
  const resumeParts = [];
  if (resumeJSON.summary) resumeParts.push(resumeJSON.summary);
  if (resumeJSON.contact?.title) resumeParts.push(resumeJSON.contact.title);

  const skills = resumeJSON.skills || {};
  Object.values(skills).forEach((arr) => {
    if (Array.isArray(arr)) resumeParts.push(...arr);
  });

  (resumeJSON.experience || []).forEach((exp) => {
    if (exp.title) resumeParts.push(exp.title);
    if (exp.highlights) resumeParts.push(...exp.highlights);
  });

  (resumeJSON.projects || []).forEach((proj) => {
    if (proj.name) resumeParts.push(proj.name);
    if (proj.description) resumeParts.push(proj.description);
    if (proj.technologies) resumeParts.push(...proj.technologies);
    if (proj.highlights) resumeParts.push(...proj.highlights);
  });

  (resumeJSON.education || []).forEach((edu) => {
    if (edu.degree) resumeParts.push(edu.degree);
    if (edu.highlights) resumeParts.push(...edu.highlights);
  });

  const resumeText = resumeParts.join(" ").toLowerCase();

  // Find significant JD keywords (appearing 2+ times or multi-word tech terms)
  // Also include single-occurrence technical terms
  const techPatterns =
    /\b(python|javascript|typescript|react|angular|vue|node\.?js|java|c\+\+|c#|go|golang|rust|ruby|php|swift|kotlin|scala|r|sql|nosql|mongodb|postgresql|mysql|redis|docker|kubernetes|k8s|aws|gcp|azure|terraform|jenkins|ci\/cd|git|graphql|rest|api|microservices|agile|scrum|machine\s?learning|deep\s?learning|nlp|computer\s?vision|tensorflow|pytorch|pandas|numpy|spark|hadoop|kafka|rabbitmq|elasticsearch|nginx|linux|bash|powershell|figma|sketch|jira|confluence|html|css|sass|webpack|vite|next\.?js|express|django|flask|spring|rails|laravel|firebase|supabase|vercel|netlify|heroku)\b/gi;

  const jdTechMatches = jobDescriptionText.match(techPatterns) || [];
  const uniqueJDTech = [
    ...new Set(jdTechMatches.map((t) => t.toLowerCase())),
  ];

  // Score: what percentage of JD tech keywords appear in the resume
  let matched = 0;
  const matchedKeywords = [];
  const missingKeywords = [];

  uniqueJDTech.forEach((keyword) => {
    // Check for the keyword or common variations
    const variations = [
      keyword,
      keyword.replace(/\./g, ""),
      keyword.replace(/\s/g, ""),
    ];
    const found = variations.some((v) => resumeText.includes(v));
    if (found) {
      matched++;
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const score =
    uniqueJDTech.length > 0
      ? Math.round((matched / uniqueJDTech.length) * 100)
      : 0;

  return {
    score,
    totalKeywords: uniqueJDTech.length,
    matchedCount: matched,
    matchedKeywords,
    missingKeywords,
  };
}

/**
 * Generate a tailored resume from a PDF resume file + job description.
 * Uses a two-pass pipeline: Extract → Rewrite
 *
 * @param {string} pdfBase64 - Base64-encoded PDF file data (without data URI prefix)
 * @param {string} jobDescription - The target job description text
 * @param {Array} githubProjects - Optional array of GitHub project objects
 */
export async function generateTailoredResume(
  pdfBase64,
  jobDescription,
  githubProjects = []
) {
  if (!ai)
    throw new Error("Gemini API not initialized. Please set your API key.");

  // ===== PASS 1: EXTRACT RAW DATA =====
  const extractResponse = await callWithRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              text: EXTRACT_PROMPT,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8000 },
    })
  );

  const extractText = extractResponseText(extractResponse);
  const rawData = parseJSONResponse(extractText);

  console.log(
    "✅ Pass 1 complete — raw data extracted from PDF:",
    Object.keys(rawData)
  );

  // ===== PASS 2: REWRITE WITH JD ALIGNMENT =====
  const cleanedProjects = cleanGitHubProjects(githubProjects);
  const rewritePrompt = REWRITE_PROMPT(rawData, jobDescription, cleanedProjects);

  const rewriteResponse = await callWithRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: rewritePrompt,
      config: { maxOutputTokens: 8000 },
    })
  );

  const rewriteText = extractResponseText(rewriteResponse);
  const result = parseJSONResponse(rewriteText);

  console.log(
    "✅ Pass 2 complete — resume rewritten for JD alignment:",
    Object.keys(result)
  );

  return result;
}

export async function enhanceSection(
  sectionName,
  currentContent,
  jobDescription
) {
  if (!ai) throw new Error("Gemini API not initialized.");

  const prompt = `You are an expert resume writer. Enhance this ${sectionName} section to better match the job description.

CURRENT CONTENT:
${JSON.stringify(currentContent, null, 2)}

JOB DESCRIPTION CONTEXT:
${jobDescription}

ENHANCEMENT RULES:
- Do NOT add skills, technologies, or experiences that are not in the current content
- DO rewrite bullet points to follow: ACTION VERB + WHAT YOU DID + MEASURABLE RESULT
- DO use stronger action verbs (Engineered, Architected, Spearheaded, Optimized, Reduced, Increased)
- DO preserve all factual information (company names, dates, project names)
- If the current content has metrics, keep them. If not, write strong qualitative bullets — do NOT invent numbers.
- BANNED: "Responsible for", "Worked on", "Helped with", "Assisted in"

Return ONLY the enhanced content as valid JSON (same structure as input), no markdown fences, no extra text.`;

  const response = await callWithRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 4000 },
    })
  );

  const text = extractResponseText(response);
  return parseJSONResponse(text);
}
