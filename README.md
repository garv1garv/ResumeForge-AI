# 🚀 ResumeForge AI

**ResumeForge AI** is a state-of-the-art, local-first web application that leverages Google's **Gemini 2.5 Flash Multimodal AI** to intelligently align your existing resume with any target job description. 

Instead of writing a new resume from scratch, you upload your current PDF resume and paste the job description you want to apply for. The AI extracts your real background and rewrites, reorders, and optimizes your bullet points and skills to create the perfect tailored resume—all while strictly preserving your real data.

![ResumeForge AI Preview](public/preview.png) *(Preview placeholder)*

## ✨ Features

- **🧠 Smart AI Tailoring:** Uses the powerful `gemini-2.5-flash` model to analyze your existing PDF resume and a target job description side-by-side.
- **📄 Native PDF Upload:** No need to scrape your text. Simply drag and drop your existing PDF resume constraints and the multimodal AI handles the rest.
- **🛡️ Zero Hallucinations:** Engineered with strict prompt boundaries to guarantee it **never** fabricates companies, schools, dates, or names. It only reshapes your existing reality into the best light for the role.
- **📝 Live Interactive Editor:** A premium glassmorphic, split-pane workspace. Edit your AI-generated JSON data on the left and see it instantly reflect on a beautiful live preview on the right.
- **🐙 GitHub Integration:** Seamlessly fetch your public GitHub repositories and let the AI pick the most relevant projects for the job.
- **🖨️ Professional PDF Export:** Generates highly precise, ATS-friendly PDFs using `jsPDF` with maintained active links for your LinkedIn, Email, and Project URLs.
- **🎨 Premium Aesthetic:** A modern dark-mode aesthetic featuring deep glassmorphism, dynamic scrolling panels, animated toast notifications, and stunning Google Fonts typography.

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash Multimodal)
- **PDF Generation:** `jspdf`
- **Styling:** Custom CSS (CSS Variables, Flexbox/Grid Subgrids, Glassmorphism, CSS Animations)
- **Icons:** Custom SVG components

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A **Google Gemini API Key**. You can get one for free at [Google AI Studio](https://aistudio.google.com/).

### Installation

1. Clone or download the repository.
2. Open your terminal and navigate to the project directory.
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

## 💡 How to Use

1. **Setup:** On the top bar, enter your Gemini API Key. *(Optional: Enter your GitHub username to fetch and include your latest repos in the AI generation).*
2. **Upload & Paste:** 
   - Drag and drop your **current resume in PDF format** into the uploader.
   - Paste the **Job Description** of the role you're applying for.
3. **Generate:** Click the **Generate Tailored Resume** button. The AI will cross-reference your PDF with the JD and structure the newly tailored data.
4. **Review & Edit:** Tweak any of the fields in the left-hand workspace. Add missing skills, fix a bullet point, or change a date.
5. **Download:** Click the **Download PDF** button at the top right to instantly export a beautiful, print-ready, ATS-friendly PDF with clickable links.

## 🔒 Privacy & Security

ResumeForge AI is designed as a **client-side application**. Your API key and personal resume data are exclusively kept in your active browser session and sent directly to Google's Gemini endpoint. No data is stored or transmitted by our servers.

---
*Built to take the friction out of the modern job hunt.*
