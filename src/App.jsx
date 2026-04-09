import { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { initGemini, generateTailoredResume } from './utils/gemini';
import { fetchGitHubRepos } from './utils/github';
import { downloadPDF } from './utils/pdfGenerator';

// ===== ICONS (inline SVGs for zero-dep) =====
const Icons = {
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Briefcase: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  GraduationCap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/></svg>,
  Code: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Folder: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  Award: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  FileText: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>,
  Plus: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  Trash: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Github: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  Key: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.3 9.3"/><path d="m22 3-1.5-1.5"/></svg>,
  Wand: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>,
  Upload: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Sun: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
};

// ===== DEFAULT RESUME DATA =====
const DEFAULT_DATA = {
  contact: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  skills: { languages: [], frameworks: [], tools: [], domains: [] },
  experience: [],
  projects: [],
  education: [],
  certifications: [],
};

// ===== TOAST SYSTEM =====
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ===== COLLAPSIBLE SECTION =====
function Section({ icon: Icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="editor-section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <div className="section-header-left">
          <div className="section-icon"><Icon /></div>
          <span className="section-title">{title}</span>
          {badge && <span className="section-badge">{badge}</span>}
        </div>
        <span className={`section-toggle ${open ? 'open' : ''}`}><Icons.ChevronDown /></span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

// ===== RESUME PREVIEW COMPONENT =====
function ResumePreview({ data }) {
  if (!data || (!data.contact?.name && !data.summary)) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <h3>No Resume Data Yet</h3>
        <p>Paste a job description and click "Generate with AI" to create your tailored resume, or fill in the fields manually.</p>
      </div>
    );
  }

  return (
    <div className="resume-preview" id="resume-preview">
      {/* Header */}
      <h1>{data.contact?.name || 'Your Name'}</h1>
      {data.contact?.title && <div className="resume-title">{data.contact.title}</div>}

      <div className="resume-contact-line">
        {data.contact?.email && <><a href={`mailto:${data.contact.email}`}>{data.contact.email}</a><span className="sep">•</span></>}
        {data.contact?.phone && <><span>{data.contact.phone}</span><span className="sep">•</span></>}
        {data.contact?.location && <span>{data.contact.location}</span>}
      </div>

      <div className="resume-contact-line">
        {data.contact?.linkedin && <><a href={data.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><span className="sep">|</span></>}
        {data.contact?.github && <><a href={data.contact.github} target="_blank" rel="noreferrer">GitHub</a><span className="sep">|</span></>}
        {data.contact?.portfolio && <a href={data.contact.portfolio} target="_blank" rel="noreferrer">Portfolio</a>}
      </div>

      <hr className="resume-divider" />

      {/* Summary */}
      {data.summary && (
        <div className="resume-section">
          <div className="resume-section-title">Professional Summary</div>
          <p style={{ fontSize: '9.5pt', color: '#1e293b', lineHeight: 1.55 }}>{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {data.skills && Object.values(data.skills).some(a => a?.length > 0) && (
        <div className="resume-section">
          <div className="resume-section-title">Technical Skills</div>
          <div className="resume-skills-grid">
            {data.skills.languages?.length > 0 && <div className="resume-skill-row"><strong>Languages: </strong>{data.skills.languages.join(', ')}</div>}
            {data.skills.frameworks?.length > 0 && <div className="resume-skill-row"><strong>Frameworks & Libraries: </strong>{data.skills.frameworks.join(', ')}</div>}
            {data.skills.tools?.length > 0 && <div className="resume-skill-row"><strong>Tools & Platforms: </strong>{data.skills.tools.join(', ')}</div>}
            {data.skills.domains?.length > 0 && <div className="resume-skill-row"><strong>Domains: </strong>{data.skills.domains.join(', ')}</div>}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <div className="resume-section">
          <div className="resume-section-title">Professional Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} className="resume-entry">
              <div className="resume-entry-header">
                <span className="resume-entry-title">{exp.title}</span>
                <span className="resume-entry-date">{exp.startDate} – {exp.endDate}</span>
              </div>
              <div className="resume-entry-subtitle">{[exp.company, exp.location].filter(Boolean).join(', ')}</div>
              {exp.highlights?.length > 0 && (
                <ul>{exp.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects?.length > 0 && (
        <div className="resume-section">
          <div className="resume-section-title">Projects</div>
          {data.projects.map((proj, i) => (
            <div key={i} className="resume-entry">
              <div className="resume-entry-header">
                <span className="resume-entry-title">
                  {proj.link ? <a className="resume-project-link" href={proj.link} target="_blank" rel="noreferrer">{proj.name}</a> : proj.name}
                </span>
                {proj.technologies?.length > 0 && <span className="resume-project-tech">{proj.technologies.join(' • ')}</span>}
              </div>
              {proj.description && <p style={{ fontSize: '9pt', color: '#334155', marginBottom: 3 }}>{proj.description}</p>}
              {proj.highlights?.length > 0 && (
                <ul>{proj.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education?.length > 0 && (
        <div className="resume-section">
          <div className="resume-section-title">Education</div>
          {data.education.map((edu, i) => (
            <div key={i} className="resume-entry">
              <div className="resume-entry-header">
                <span className="resume-entry-title">{edu.degree}</span>
                <span className="resume-entry-date">{edu.graduationDate}</span>
              </div>
              <div className="resume-entry-subtitle">
                {[edu.school, edu.location].filter(Boolean).join(', ')}
                {edu.gpa && ` | GPA: ${edu.gpa}`}
              </div>
              {edu.highlights?.length > 0 && (
                <ul>{edu.highlights.map((h, j) => <li key={j}>{h}</li>)}</ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {data.certifications?.length > 0 && (
        <div className="resume-section">
          <div className="resume-section-title">Certifications</div>
          {data.certifications.map((cert, i) => (
            <div key={i} className="resume-entry">
              <div className="resume-entry-header">
                <span className="resume-entry-title">
                  {cert.link ? <a className="resume-cert-link" href={cert.link} target="_blank" rel="noreferrer">{cert.name}</a> : cert.name}
                </span>
                <span className="resume-entry-date">{[cert.issuer, cert.date].filter(Boolean).join(' • ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== MAIN APP =====
function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [atsData, setAtsData] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [apiKey, setApiKey] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubStatus, setGithubStatus] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [previousResume, setPreviousResume] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const { toasts, add: addToast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);


  // Update nested data
  const updateContact = (field, value) => {
    setData(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const updateSummary = (value) => {
    setData(prev => ({ ...prev, summary: value }));
  };

  // Skills management
  const addSkill = (category, skill) => {
    if (!skill.trim()) return;
    setData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...(prev.skills[category] || []), skill.trim()],
      },
    }));
  };

  const removeSkill = (category, index) => {
    setData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index),
      },
    }));
  };

  // Experience management
  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', location: '', startDate: '', endDate: '', highlights: [''] }],
    }));
  };

  const updateExperience = (index, field, value) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => i === index ? { ...exp, [field]: value } : exp),
    }));
  };

  const removeExperience = (index) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  const updateExpHighlight = (expIdx, hlIdx, value) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIdx ? { ...exp, highlights: exp.highlights.map((h, j) => j === hlIdx ? value : h) } : exp
      ),
    }));
  };

  const addExpHighlight = (expIdx) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIdx ? { ...exp, highlights: [...(exp.highlights || []), ''] } : exp
      ),
    }));
  };

  const removeExpHighlight = (expIdx, hlIdx) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIdx ? { ...exp, highlights: exp.highlights.filter((_, j) => j !== hlIdx) } : exp
      ),
    }));
  };

  // Project management
  const addProject = () => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', description: '', technologies: [], link: '', highlights: [''] }],
    }));
  };

  const updateProject = (index, field, value) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const removeProject = (index) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));
  };

  const updateProjHighlight = (projIdx, hlIdx, value) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map((p, i) =>
        i === projIdx ? { ...p, highlights: p.highlights.map((h, j) => j === hlIdx ? value : h) } : p
      ),
    }));
  };

  const addProjHighlight = (projIdx) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map((p, i) =>
        i === projIdx ? { ...p, highlights: [...(p.highlights || []), ''] } : p
      ),
    }));
  };

  const removeProjHighlight = (projIdx, hlIdx) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map((p, i) =>
        i === projIdx ? { ...p, highlights: p.highlights.filter((_, j) => j !== hlIdx) } : p
      ),
    }));
  };

  // Education management
  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', school: '', location: '', graduationDate: '', gpa: '', highlights: [''] }],
    }));
  };

  const updateEducation = (index, field, value) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map((e, i) => i === index ? { ...e, [field]: value } : e),
    }));
  };

  const removeEducation = (index) => {
    setData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  // Certification management
  const addCertification = () => {
    setData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', date: '', link: '' }],
    }));
  };

  const updateCertification = (index, field, value) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  const removeCertification = (index) => {
    setData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
  };

  // GitHub fetch
  const handleFetchGitHub = async () => {
    if (!githubUsername.trim()) return;
    setGithubStatus('loading');
    try {
      const repos = await fetchGitHubRepos(githubUsername.trim());
      setGithubRepos(repos);
      setGithubStatus('success');
      addToast(`Found ${repos.length} repos from GitHub!`, 'success');
    } catch (err) {
      setGithubStatus('error');
      addToast(err.message, 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      addToast("Please upload a valid PDF file.", "error");
      return;
    }

    setPdfFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      // Extract just the base64 data portion
      const base64Data = event.target.result.split(',')[1];
      setPreviousResume(base64Data);
      addToast(`Loaded ${file.name} successfully.`, "success");
    };
    reader.onerror = () => {
      addToast("Failed to read the PDF file.", "error");
    };
    reader.readAsDataURL(file);
  };

  // AI Generate
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      addToast('Please enter your Gemini API key first.', 'error');
      return;
    }
    if (!previousResume) {
      addToast('Please upload your existing resume PDF first.', 'error');
      return;
    }
    if (!jobDescription.trim()) {
      addToast('Please paste the job description first.', 'error');
      return;
    }

    setIsGenerating(true);
    addToast('Analyzing your PDF resume & tailoring to job description...', 'info');

    try {
      initGemini(apiKey.trim());
      const result = await generateTailoredResume(
        previousResume,
        jobDescription,
        githubRepos.length > 0 ? githubRepos : []
      );

      if (result.atsScore) {
        setAtsData(result.atsScore);
        // Remove atsScore from the data so it doesn't break the PDF structure if unexpected
        delete result.atsScore;
      }

      setData(result);
      addToast('Tailored resume generated! Review and edit below.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // PDF Download
  const handleDownloadPDF = () => {
    try {
      const filename = data.contact?.name
        ? `${data.contact.name.replace(/\s+/g, '_')}_Resume.pdf`
        : 'Resume.pdf';
      downloadPDF(data, filename);
      addToast('PDF downloaded!', 'success');
    } catch (err) {
      addToast('Failed to generate PDF: ' + err.message, 'error');
    }
  };

  // Skill input refs
  const skillInputRefs = useRef({});

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">R</div>
          <div>
            <div className="header-title">ResumeForge AI</div>
            <div className="header-subtitle">AI-Powered Resume Builder</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-icon" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
            {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSetup(!showSetup)}>
            <Icons.Key /> {showSetup ? 'Hide Setup' : 'Setup'}
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={!data.contact?.name}>
            <Icons.Download /> Download PDF
          </button>
        </div>
      </header>

      {/* Setup Panel */}
      {showSetup && (
        <div className="setup-panel animate-fade-in">
          <div className="setup-grid">
            <div className="setup-field">
              <label>Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="setup-field">
              <label>GitHub Username</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="your-username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchGitHub()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary" onClick={handleFetchGitHub} style={{ padding: '8px 14px' }}>
                  <Icons.Github /> Fetch
                </button>
              </div>
              {githubStatus && (
                <div className={`github-status ${githubStatus}`}>
                  {githubStatus === 'loading' && <><span className="spinner" /> Fetching repos...</>}
                  {githubStatus === 'success' && `✓ ${githubRepos.length} repositories loaded`}
                  {githubStatus === 'error' && '✕ Failed to fetch repos'}
                </div>
              )}
            </div>
            <div className="setup-field">
              <label>Quick Info</label>
              <input
                type="text"
                placeholder="Your full name"
                value={data.contact.name}
                onChange={(e) => updateContact('name', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Panels: Previous Resume + Job Description */}
      <div className="jd-panel">
        <div className="jd-panel-inner">
          <div className="jd-header">
            <h3><Icons.Sparkles /> Paste Your Info & Generate</h3>
            <div className="jd-actions">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating || !previousResume || !jobDescription.trim()}
              >
                {isGenerating ? <><span className="spinner" /> Tailoring...</> : <><Icons.Wand /> Generate Tailored Resume</>}
              </button>
            </div>
          </div>
          <div className="jd-dual-inputs">
            <div className="jd-input-col">
              <label className="jd-input-label">📄 Your Existing Resume (PDF)</label>
              <div className={`file-upload-box ${previousResume ? 'has-file' : ''}`}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  id="resume-upload"
                  className="file-input-hidden"
                />
                <label htmlFor="resume-upload" className="file-upload-label">
                  <div className="file-upload-icon">
                    {previousResume ? <Icons.FileText /> : <Icons.Upload />}
                  </div>
                  <div className="file-upload-text">
                    {pdfFileName ? (
                      <span className="file-name">{pdfFileName}</span>
                    ) : (
                      <>
                        <span className="upload-link">Click to upload</span> or drag and drop
                        <br />
                        <small>PDF files only</small>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
            <div className="jd-input-col">
              <label className="jd-input-label">🎯 Target Job Description</label>
              <textarea
                className="jd-textarea"
                placeholder="Paste the job description you're applying for... The AI will tailor your resume's wording, skills, and bullet points to match what this role needs."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ATS Score Panel */}
      {atsData && (
        <div className="ats-panel animate-slide-up">
          <div className="ats-panel-inner">
            <div className="ats-header">
              <h3><Icons.Sparkles /> ATS Match Analysis</h3>
              <p>Based on your selected Job Description</p>
            </div>
            <div className="ats-grid">
              <div className="ats-score-card">
                <div className="ats-score-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path className="circle"
                      strokeDasharray={`${atsData.newScore}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">{atsData.newScore}%</text>
                  </svg>
                </div>
                <div className="ats-score-stats">
                  <div>Previous Score: <strong>{atsData.originalScore}%</strong></div>
                  <div className="ats-score-diff">+{atsData.newScore - atsData.originalScore}% Boost</div>
                </div>
              </div>
              <div className="ats-details">
                <div className="ats-keywords">
                  <label>Matched Keywords</label>
                  <div className="keyword-tags">
                    {atsData.matchedKeywords?.map((kw, i) => <span key={i} className="keyword-tag">{kw}</span>)}
                  </div>
                </div>
                <div className="ats-improvements">
                  <label>Key Improvements</label>
                  <ul className="ats-improvements-list">
                    {atsData.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace: Editor + Preview */}
      <div className="workspace">
        {/* Editor Panel */}
        <div className="editor-panel">
          {/* Contact Info */}
          <Section icon={Icons.User} title="Contact Information" defaultOpen={true}>
            <div className="form-grid">
              <div className="form-field">
                <label>Full Name</label>
                <input value={data.contact?.name || ''} onChange={(e) => updateContact('name', e.target.value)} placeholder="John Doe" />
              </div>
              <div className="form-field">
                <label>Professional Title</label>
                <input value={data.contact?.title || ''} onChange={(e) => updateContact('title', e.target.value)} placeholder="Senior AI Engineer" />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={data.contact?.email || ''} onChange={(e) => updateContact('email', e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input value={data.contact?.phone || ''} onChange={(e) => updateContact('phone', e.target.value)} placeholder="+1-555-123-4567" />
              </div>
              <div className="form-field">
                <label>Location</label>
                <input value={data.contact?.location || ''} onChange={(e) => updateContact('location', e.target.value)} placeholder="San Francisco, CA" />
              </div>
              <div className="form-field">
                <label>LinkedIn URL</label>
                <input value={data.contact?.linkedin || ''} onChange={(e) => updateContact('linkedin', e.target.value)} placeholder="https://linkedin.com/in/johndoe" />
              </div>
              <div className="form-field">
                <label>GitHub URL</label>
                <input value={data.contact?.github || ''} onChange={(e) => updateContact('github', e.target.value)} placeholder="https://github.com/johndoe" />
              </div>
              <div className="form-field">
                <label>Portfolio URL</label>
                <input value={data.contact?.portfolio || ''} onChange={(e) => updateContact('portfolio', e.target.value)} placeholder="https://johndoe.dev" />
              </div>
            </div>
          </Section>

          {/* Summary */}
          <Section icon={Icons.FileText} title="Professional Summary" defaultOpen={true}>
            <div className="form-field full-width">
              <textarea
                value={data.summary || ''}
                onChange={(e) => updateSummary(e.target.value)}
                placeholder="A passionate and results-driven engineer with..."
                rows={4}
              />
            </div>
          </Section>

          {/* Skills */}
          <Section icon={Icons.Code} title="Technical Skills" badge={Object.values(data.skills || {}).flat().length || null} defaultOpen={true}>
            {['languages', 'frameworks', 'tools', 'domains'].map((cat) => (
              <div key={cat} className="skills-category">
                <div className="skills-category-label">
                  {cat === 'languages' ? 'Languages' : cat === 'frameworks' ? 'Frameworks & Libraries' : cat === 'tools' ? 'Tools & Platforms' : 'Domains & Expertise'}
                </div>
                <div className="skills-tags">
                  {(data.skills?.[cat] || []).map((skill, i) => (
                    <span key={i} className="skill-tag">
                      {skill}
                      <span className="remove-skill" onClick={() => removeSkill(cat, i)}>×</span>
                    </span>
                  ))}
                </div>
                <div className="skill-input-wrap">
                  <input
                    ref={(el) => { skillInputRefs.current[cat] = el; }}
                    placeholder={`Add ${cat === 'domains' ? 'domain' : cat.slice(0, -1)}...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addSkill(cat, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button className="btn btn-ghost btn-icon" onClick={() => {
                    const input = skillInputRefs.current[cat];
                    if (input && input.value.trim()) {
                      addSkill(cat, input.value);
                      input.value = '';
                    }
                  }}>
                    <Icons.Plus />
                  </button>
                </div>
              </div>
            ))}
          </Section>

          {/* Experience */}
          <Section icon={Icons.Briefcase} title="Experience" badge={data.experience?.length || null} defaultOpen={true}>
            {data.experience?.map((exp, i) => (
              <div key={i} className="list-item">
                <div className="list-item-header">
                  <div>
                    <div className="list-item-title">{exp.title || 'New Position'}</div>
                    <div className="list-item-subtitle">{exp.company || 'Company'}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => removeExperience(i)} title="Remove">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Job Title</label>
                    <input value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Company</label>
                    <input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Location</label>
                    <input value={exp.location} onChange={(e) => updateExperience(i, 'location', e.target.value)} />
                  </div>
                  <div className="form-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label>Start Date</label>
                      <input value={exp.startDate} onChange={(e) => updateExperience(i, 'startDate', e.target.value)} placeholder="Jan 2022" />
                    </div>
                    <div>
                      <label>End Date</label>
                      <input value={exp.endDate} onChange={(e) => updateExperience(i, 'endDate', e.target.value)} placeholder="Present" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highlights</label>
                  {exp.highlights?.map((h, j) => (
                    <div key={j} className="highlight-item">
                      <input value={h} onChange={(e) => updateExpHighlight(i, j, e.target.value)} placeholder="Achieved..." />
                      <button className="btn btn-ghost btn-icon" onClick={() => removeExpHighlight(i, j)}><Icons.Trash /></button>
                    </div>
                  ))}
                  <button className="add-btn" onClick={() => addExpHighlight(i)} style={{ marginTop: 4 }}>
                    <Icons.Plus /> Add Highlight
                  </button>
                </div>
              </div>
            ))}
            <button className="add-btn" onClick={addExperience}>
              <Icons.Plus /> Add Experience
            </button>
          </Section>

          {/* Projects */}
          <Section icon={Icons.Folder} title="Projects" badge={data.projects?.length || null} defaultOpen={true}>
            {data.projects?.map((proj, i) => (
              <div key={i} className="list-item">
                <div className="list-item-header">
                  <div>
                    <div className="list-item-title">{proj.name || 'New Project'}</div>
                    <div className="list-item-subtitle">{proj.technologies?.join(', ') || 'Technologies'}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => removeProject(i)} title="Remove">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Project Name</label>
                    <input value={proj.name} onChange={(e) => updateProject(i, 'name', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Link</label>
                    <input value={proj.link || ''} onChange={(e) => updateProject(i, 'link', e.target.value)} placeholder="https://github.com/..." />
                  </div>
                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea value={proj.description || ''} onChange={(e) => updateProject(i, 'description', e.target.value)} rows={2} />
                  </div>
                  <div className="form-field full-width">
                    <label>Technologies (comma-separated)</label>
                    <input
                      value={(proj.technologies || []).join(', ')}
                      onChange={(e) => updateProject(i, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highlights</label>
                  {proj.highlights?.map((h, j) => (
                    <div key={j} className="highlight-item">
                      <input value={h} onChange={(e) => updateProjHighlight(i, j, e.target.value)} placeholder="Key feature or achievement..." />
                      <button className="btn btn-ghost btn-icon" onClick={() => removeProjHighlight(i, j)}><Icons.Trash /></button>
                    </div>
                  ))}
                  <button className="add-btn" onClick={() => addProjHighlight(i)} style={{ marginTop: 4 }}>
                    <Icons.Plus /> Add Highlight
                  </button>
                </div>
              </div>
            ))}
            <button className="add-btn" onClick={addProject}>
              <Icons.Plus /> Add Project
            </button>
          </Section>

          {/* Education */}
          <Section icon={Icons.GraduationCap} title="Education" badge={data.education?.length || null} defaultOpen={true}>
            {data.education?.map((edu, i) => (
              <div key={i} className="list-item">
                <div className="list-item-header">
                  <div>
                    <div className="list-item-title">{edu.degree || 'New Degree'}</div>
                    <div className="list-item-subtitle">{edu.school || 'University'}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => removeEducation(i)} title="Remove">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Degree</label>
                    <input value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>School</label>
                    <input value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Location</label>
                    <input value={edu.location || ''} onChange={(e) => updateEducation(i, 'location', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Graduation Date</label>
                    <input value={edu.graduationDate} onChange={(e) => updateEducation(i, 'graduationDate', e.target.value)} placeholder="May 2024" />
                  </div>
                  <div className="form-field">
                    <label>GPA</label>
                    <input value={edu.gpa || ''} onChange={(e) => updateEducation(i, 'gpa', e.target.value)} placeholder="3.8/4.0" />
                  </div>
                </div>
              </div>
            ))}
            <button className="add-btn" onClick={addEducation}>
              <Icons.Plus /> Add Education
            </button>
          </Section>

          {/* Certifications */}
          <Section icon={Icons.Award} title="Certifications" badge={data.certifications?.length || null} defaultOpen={false}>
            {data.certifications?.map((cert, i) => (
              <div key={i} className="list-item">
                <div className="list-item-header">
                  <div className="list-item-title">{cert.name || 'New Certification'}</div>
                  <div className="list-item-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => removeCertification(i)} title="Remove">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Name</label>
                    <input value={cert.name} onChange={(e) => updateCertification(i, 'name', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Issuer</label>
                    <input value={cert.issuer} onChange={(e) => updateCertification(i, 'issuer', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Date</label>
                    <input value={cert.date} onChange={(e) => updateCertification(i, 'date', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Credential Link</label>
                    <input value={cert.link || ''} onChange={(e) => updateCertification(i, 'link', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </div>
            ))}
            <button className="add-btn" onClick={addCertification}>
              <Icons.Plus /> Add Certification
            </button>
          </Section>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <ResumePreview data={data} />
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App;
