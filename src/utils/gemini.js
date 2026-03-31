import { GoogleGenAI } from "@google/genai";

let ai = null;

export function initGemini(apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

const PROMPT_TEMPLATE = (jobDescription, githubProjects) => `You are an elite resume consultant. You have received the user's existing resume as a PDF file attachment. You also have the job description they are applying for.

THE JOB DESCRIPTION THEY ARE APPLYING FOR:
---
${jobDescription}
---

${githubProjects.length > 0 ? `THE USER'S GITHUB PROJECTS (real projects — use these):\n---\n${JSON.stringify(githubProjects, null, 2)}\n---` : ''}

YOUR TASK:
- Extract ALL real information from the user's uploaded PDF resume (name, contact, education, experience, skills, projects, links, etc.)
- KEEP all real data — do NOT fabricate names, companies, schools, or dates
- REWRITE the summary, bullet points, and skill descriptions to perfectly match the new job description
- Add any skills from the job description that the user likely has based on their background
- Reorder sections and skills to prioritize what the job description asks for
- Make bullet points more impactful with strong action verbs and metrics where possible
- If GitHub projects are provided, include the most relevant ones tailored to the job
- Extract ALL links from the PDF (LinkedIn, GitHub, portfolio, project links, etc.) and preserve them

Generate a JSON object with this EXACT structure:
{
  "contact": {
    "name": "Real Name from resume",
    "title": "Professional Title tailored to the new job",
    "email": "real@email.com",
    "phone": "real phone",
    "location": "Real Location",
    "linkedin": "real linkedin url or empty string",
    "github": "real github url or empty string",
    "portfolio": "real portfolio url or empty string"
  },
  "summary": "A 2-3 sentence professional summary using the user's REAL background but tailored to THIS specific job description.",
  "skills": {
    "languages": ["Real skills prioritized for this job"],
    "frameworks": ["Real frameworks + any the user likely knows"],
    "tools": ["Real tools relevant to the job"],
    "domains": ["Domain expertise relevant to the job"]
  },
  "experience": [
    {
      "title": "Real Job Title",
      "company": "Real Company",
      "location": "Real Location",
      "startDate": "Real Start Date",
      "endDate": "Real End Date",
      "highlights": [
        "Real achievement rewritten to align with the target job",
        "Another real accomplishment with stronger wording"
      ]
    }
  ],
  "projects": [
    {
      "name": "Real Project Name",
      "description": "Real description rewritten to show relevance to the target job",
      "technologies": ["Real", "Tech", "Used"],
      "link": "https://github.com/real/link",
      "highlights": ["Real feature/achievement tailored to the job"]
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
      "name": "Real Certification if they have any",
      "issuer": "Real Issuer",
      "date": "Real Date",
      "link": "Real credential link or empty string"
    }
  ]
}

CRITICAL RULES:
1. NEVER fabricate companies, schools, names, or dates — use ONLY what's in the PDF resume
2. DO rewrite bullet points, summaries, and descriptions to match the job
3. DO add relevant skills the user likely has based on their background
4. DO reorder everything to prioritize what the job description values most
5. Keep it to 1-2 pages of content (concise but impactful)
6. All links from the original resume MUST be preserved
7. Return ONLY valid JSON, no markdown code fences, no extra text.`;

/**
 * Generate a tailored resume from a PDF resume file + job description.
 * @param {string} pdfBase64 - Base64-encoded PDF file data (without data URI prefix)
 * @param {string} jobDescription - The target job description text
 * @param {Array} githubProjects - Optional array of GitHub project objects
 */
export async function generateTailoredResume(pdfBase64, jobDescription, githubProjects = []) {
  if (!ai) throw new Error("Gemini API not initialized. Please set your API key.");

  const prompt = PROMPT_TEMPLATE(jobDescription, githubProjects);

  const response = await ai.models.generateContent({
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
            text: prompt,
          },
        ],
      },
    ],
  });

  const text = response.text.trim();

  let cleanText = text;
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
    console.error("Failed to parse Gemini response:", cleanText);
    throw new Error("Failed to parse AI response. Please try again.");
  }
}

export async function enhanceSection(sectionName, currentContent, jobDescription) {
  if (!ai) throw new Error("Gemini API not initialized.");

  const prompt = `You are an expert resume writer. Enhance this ${sectionName} section to better match the job description.

CURRENT CONTENT:
${JSON.stringify(currentContent, null, 2)}

JOB DESCRIPTION CONTEXT:
${jobDescription}

Return ONLY the enhanced content as valid JSON (same structure as input), no markdown fences, no extra text. Make it more impactful with stronger action verbs and metrics.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  let cleanText = response.text.trim();
  if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7);
  else if (cleanText.startsWith("```")) cleanText = cleanText.slice(3);
  if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);

  return JSON.parse(cleanText.trim());
}
