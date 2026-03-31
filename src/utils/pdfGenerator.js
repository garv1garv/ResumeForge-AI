import jsPDF from "jspdf";

const COLORS = {
  primary: [108, 99, 255],
  dark: [15, 23, 42],
  text: [30, 41, 59],
  secondary: [71, 85, 105],
  muted: [148, 163, 184],
  white: [255, 255, 255],
  accent: [99, 102, 241],
  border: [226, 232, 240],
  link: [79, 70, 229],
};

const MARGIN = { top: 20, bottom: 20, left: 22, right: 22 };
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right;

export function generateResumePDF(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN.top;

  function checkPageBreak(needed = 15) {
    if (y + needed > 297 - MARGIN.bottom) {
      doc.addPage();
      y = MARGIN.top;
      return true;
    }
    return false;
  }

  function drawLine(yPos, color = COLORS.border) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(MARGIN.left, yPos, PAGE_WIDTH - MARGIN.right, yPos);
  }

  function addLink(text, x, yPos, url, fontSize = 9) {
    doc.setFontSize(fontSize);
    doc.setTextColor(...COLORS.link);
    doc.textWithLink(text, x, yPos, { url });
    const textWidth = doc.getTextWidth(text);
    doc.setDrawColor(...COLORS.link);
    doc.setLineWidth(0.2);
    doc.line(x, yPos + 0.5, x + textWidth, yPos + 0.5);
    doc.setTextColor(...COLORS.text);
    return textWidth;
  }

  // ===== HEADER =====
  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.dark);
  doc.text(data.contact?.name || "Your Name", PAGE_WIDTH / 2, y, { align: "center" });
  y += 7;

  // Title
  if (data.contact?.title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.accent);
    doc.text(data.contact.title, PAGE_WIDTH / 2, y, { align: "center" });
    y += 6;
  }

  // Contact line
  const contactParts = [];
  if (data.contact?.email) contactParts.push({ text: data.contact.email, url: `mailto:${data.contact.email}` });
  if (data.contact?.phone) contactParts.push({ text: data.contact.phone });
  if (data.contact?.location) contactParts.push({ text: data.contact.location });

  if (contactParts.length > 0) {
    doc.setFontSize(9);
    const sep = "  •  ";
    const fullText = contactParts.map(p => p.text).join(sep);
    const totalWidth = doc.getTextWidth(fullText);
    let cx = (PAGE_WIDTH - totalWidth) / 2;

    contactParts.forEach((part, i) => {
      if (part.url) {
        addLink(part.text, cx, y, part.url, 9);
      } else {
        doc.setTextColor(...COLORS.secondary);
        doc.text(part.text, cx, y);
      }
      cx += doc.getTextWidth(part.text);
      if (i < contactParts.length - 1) {
        doc.setTextColor(...COLORS.muted);
        doc.text(sep, cx, y);
        cx += doc.getTextWidth(sep);
      }
    });
    y += 5;
  }

  // Links line
  const linkParts = [];
  if (data.contact?.linkedin) linkParts.push({ text: "LinkedIn", url: data.contact.linkedin });
  if (data.contact?.github) linkParts.push({ text: "GitHub", url: data.contact.github });
  if (data.contact?.portfolio) linkParts.push({ text: "Portfolio", url: data.contact.portfolio });

  if (linkParts.length > 0) {
    doc.setFontSize(9);
    const sep = "  |  ";
    const totalParts = linkParts.map(p => p.text).join(sep);
    const totalW = doc.getTextWidth(totalParts) + (linkParts.length - 1) * doc.getTextWidth(sep) * 0.1;
    let lx = (PAGE_WIDTH - doc.getTextWidth(totalParts)) / 2;

    linkParts.forEach((part, i) => {
      addLink(part.text, lx, y, part.url, 9);
      lx += doc.getTextWidth(part.text);
      if (i < linkParts.length - 1) {
        doc.setTextColor(...COLORS.muted);
        doc.text(sep, lx, y);
        lx += doc.getTextWidth(sep);
      }
    });
    y += 4;
  }

  y += 2;
  drawLine(y, COLORS.accent);
  y += 6;

  // ===== SECTION HEADER HELPER =====
  function sectionHeader(title) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text(title.toUpperCase(), MARGIN.left, y);
    y += 1.5;
    drawLine(y, COLORS.accent);
    y += 5;
  }

  // ===== SUMMARY =====
  if (data.summary) {
    sectionHeader("Professional Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(data.summary, CONTENT_WIDTH);
    lines.forEach((line) => {
      checkPageBreak(5);
      doc.text(line, MARGIN.left, y);
      y += 4.2;
    });
    y += 4;
  }

  // ===== SKILLS =====
  if (data.skills && Object.keys(data.skills).length > 0) {
    sectionHeader("Technical Skills");

    const skillCategories = [
      { key: "languages", label: "Languages" },
      { key: "frameworks", label: "Frameworks & Libraries" },
      { key: "tools", label: "Tools & Platforms" },
      { key: "domains", label: "Domains & Expertise" },
    ];

    skillCategories.forEach(({ key, label }) => {
      const skills = data.skills[key];
      if (skills && skills.length > 0) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        doc.text(`${label}: `, MARGIN.left, y);
        const labelW = doc.getTextWidth(`${label}: `);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.text);
        const skillText = skills.join(", ");
        const skillLines = doc.splitTextToSize(skillText, CONTENT_WIDTH - labelW);

        if (skillLines.length === 1) {
          doc.text(skillLines[0], MARGIN.left + labelW, y);
          y += 5;
        } else {
          doc.text(skillLines[0], MARGIN.left + labelW, y);
          y += 4.5;
          for (let i = 1; i < skillLines.length; i++) {
            checkPageBreak(5);
            doc.text(skillLines[i], MARGIN.left, y);
            y += 4.5;
          }
        }
      }
    });
    y += 3;
  }

  // ===== EXPERIENCE =====
  if (data.experience && data.experience.length > 0) {
    sectionHeader("Professional Experience");

    data.experience.forEach((exp) => {
      checkPageBreak(20);

      // Title and Company
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);
      doc.text(exp.title || "", MARGIN.left, y);

      // Date on right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.secondary);
      const dateText = `${exp.startDate || ""} – ${exp.endDate || ""}`;
      doc.text(dateText, PAGE_WIDTH - MARGIN.right, y, { align: "right" });
      y += 4.5;

      // Company and Location
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.secondary);
      const companyText = [exp.company, exp.location].filter(Boolean).join(", ");
      doc.text(companyText, MARGIN.left, y);
      y += 5;

      // Bullet points
      if (exp.highlights && exp.highlights.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);

        exp.highlights.forEach((h) => {
          checkPageBreak(6);
          doc.text("•", MARGIN.left + 2, y);
          const bulletLines = doc.splitTextToSize(h, CONTENT_WIDTH - 8);
          bulletLines.forEach((line, li) => {
            doc.text(line, MARGIN.left + 7, y);
            y += 4;
          });
        });
      }
      y += 4;
    });
  }

  // ===== PROJECTS =====
  if (data.projects && data.projects.length > 0) {
    sectionHeader("Projects");

    data.projects.forEach((proj) => {
      checkPageBreak(18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);

      if (proj.link) {
        addLink(proj.name || "Project", MARGIN.left, y, proj.link, 10);
      } else {
        doc.text(proj.name || "Project", MARGIN.left, y);
      }

      // Technologies on right
      if (proj.technologies && proj.technologies.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.accent);
        const techText = proj.technologies.join(" • ");
        doc.text(techText, PAGE_WIDTH - MARGIN.right, y, { align: "right" });
      }
      y += 4.5;

      // Description
      if (proj.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);
        const descLines = doc.splitTextToSize(proj.description, CONTENT_WIDTH);
        descLines.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, MARGIN.left, y);
          y += 4;
        });
      }

      // Highlights
      if (proj.highlights && proj.highlights.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);
        proj.highlights.forEach((h) => {
          checkPageBreak(5);
          doc.text("•", MARGIN.left + 2, y);
          const hLines = doc.splitTextToSize(h, CONTENT_WIDTH - 8);
          hLines.forEach((line) => {
            doc.text(line, MARGIN.left + 7, y);
            y += 4;
          });
        });
      }
      y += 4;
    });
  }

  // ===== EDUCATION =====
  if (data.education && data.education.length > 0) {
    sectionHeader("Education");

    data.education.forEach((edu) => {
      checkPageBreak(15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);
      doc.text(edu.degree || "", MARGIN.left, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.secondary);
      doc.text(edu.graduationDate || "", PAGE_WIDTH - MARGIN.right, y, { align: "right" });
      y += 4.5;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.secondary);
      const schoolText = [edu.school, edu.location].filter(Boolean).join(", ");
      if (edu.gpa) {
        doc.text(`${schoolText}  |  GPA: ${edu.gpa}`, MARGIN.left, y);
      } else {
        doc.text(schoolText, MARGIN.left, y);
      }
      y += 4.5;

      if (edu.highlights && edu.highlights.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);
        edu.highlights.forEach((h) => {
          checkPageBreak(5);
          doc.text("•", MARGIN.left + 2, y);
          const hLines = doc.splitTextToSize(h, CONTENT_WIDTH - 8);
          hLines.forEach((line) => {
            doc.text(line, MARGIN.left + 7, y);
            y += 4;
          });
        });
      }
      y += 3;
    });
  }

  // ===== CERTIFICATIONS =====
  if (data.certifications && data.certifications.length > 0) {
    sectionHeader("Certifications");

    data.certifications.forEach((cert) => {
      checkPageBreak(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);

      if (cert.link) {
        addLink(cert.name || "", MARGIN.left, y, cert.link, 9);
      } else {
        doc.text(cert.name || "", MARGIN.left, y);
      }

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondary);
      const certMeta = [cert.issuer, cert.date].filter(Boolean).join(" • ");
      doc.text(certMeta, PAGE_WIDTH - MARGIN.right, y, { align: "right" });
      y += 5;
    });
  }

  return doc;
}

export function downloadPDF(data, filename = "resume.pdf") {
  const doc = generateResumePDF(data);
  doc.save(filename);
}
