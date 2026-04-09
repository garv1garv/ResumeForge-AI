import { useEffect, useState, useRef } from 'react';
import './LandingPage.css';

function useItersectionObserver(options = {}) {
  const [elements, setElements] = useState([]);
  const [entries, setEntries] = useState([]);

  const observer = useRef(
    new IntersectionObserver((observedEntries) => {
      setEntries(observedEntries);
    }, options)
  );

  useEffect(() => {
    const currentObserver = observer.current;
    currentObserver.disconnect();
    if (elements.length) {
      elements.forEach(elem => currentObserver.observe(elem));
    }
    return () => currentObserver.disconnect();
  }, [elements]);

  return [setElements, entries];
}

export default function LandingPage({ onEnter }) {
  const [scrollY, setScrollY] = useState(0);

  // Simple scroll trigger logic classes
  useEffect(() => {
    const handleScroll = () => requestAnimationFrame(() => setScrollY(window.scrollY));
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Intersection observer for `.reveal` elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="shader-body">
      {/* Physical Monitor Bezel / Frame */}
      <div className="monitor-bezel">
        <div className="screen-glare"></div>
        <div className="crts-scanlines"></div>
        <div className="film-grain"></div>

        <nav className="shader-nav">
          <div className="nav-left">ResumeForge</div>
          <div className="nav-right">
            <a href="#work">Selected Work</a>
            <a href="#about-us">About Us</a>
            <a href="#contact">Contact</a>
            <button className="book-call-btn" onClick={onEnter}>Launch Editor ↗</button>
          </div>
        </nav>

        <div className="scroll-wrapper">
          {/* Hero Section */}
          <section className="shader-hero reveal">
            <div className="hero-content">
              <h1 className="hero-title" style={{ transform: `translateY(${scrollY * -0.2}px)` }}>
                An AI Resume Studio, <br />
                <em>Plugged into the Future.</em>
              </h1>
              <div className="hero-footer">
                <span className="scroll-prompt">↓ Scroll to Inspect</span>
              </div>
            </div>
          </section>

          {/* Trusted By Client Logos */}
          <section className="client-logos-section">
            <p className="client-label">TRUSTED BY ENGINEERS & DESIGNERS AT</p>
            <div className="logos-grid">
              {/* Official Brand Wordmarks - Monochrome White */}
              <div className="logo-item" title="Google">
                <svg width="100" height="24" viewBox="0 0 533.5 183.5" fill="#ffffff">
                  <path d="M110.1 79.5V110h43c-1.8 11.6-11.4 34-43 34-27.6 0-50.1-22.9-50.1-51.1S82.5 41.8 110.1 41.8c15.7 0 26.2 6.7 32.2 12.5l24.3-23.4c-15.6-14.7-35.9-23.5-56.5-23.5C49.3 7.4 0 56.7 0 117.4s49.3 110 110.1 110c63.5 0 105.7-44.6 105.7-107.5 0-7.2-.8-12.7-1.7-18.1H110.1z"/>
                  <path d="M331 117.4c0-26.6-21.7-50-51-50s-51 23.4-51 50 21.7 50 51 50 51-23.4 51-50zm-73.4 0c0-14.9 10.1-24.9 22.4-24.9s22.4 10 22.4 24.9-10.1 24.9-22.4 24.9c-12.3 0-22.4-10-22.4-24.9z"/>
                  <path d="M439.4 117.4c0-26.6-21.7-50-51-50s-51 23.4-51 50 21.7 50 51 50 51-23.4 51-50zm-73.4 0c0-14.9 10.1-24.9 22.4-24.9s22.4 10 22.4 24.9-10.1 24.9-22.4 24.9c-12.3 0-22.4-10-22.4-24.9z"/>
                </svg>
              </div>
              <div className="logo-item" title="Netflix">
                <svg width="100" height="24" viewBox="0 0 111 30" fill="#ffffff">
                  <path d="M10.5 0L0 0 0 30 5.2 30 5.2 15 10.5 15 10.5 30 15.7 30 15.7 0 10.5 0ZM25.8 0L19.5 0 19.5 30 30.6 30 30.6 25.4 24.7 25.4 24.7 17.5 30.1 17.5 30.1 12.9 24.7 12.9 24.7 4.6 30.6 4.6 30.6 0 25.8 0ZM45.6 4.6L40.2 4.6 40.2 30 35 30 35 4.6 29.7 4.6 29.7 0 45.6 0 45.6 4.6ZM55.5 0L50.4 0 50.4 30 55.6 30 55.6 17.4 61.2 17.4 61.2 12.8 55.6 12.8 55.6 4.6 61.5 4.6 61.5 0 55.5 0ZM70.4 0L65.3 0 65.3 30 76.4 30 76.4 25.4 70.4 25.4 70.4 0ZM85.5 0L80.3 0 80.3 30 85.5 30 85.5 0ZM106.3 0L100.2 10.1 94.1 0 88.6 0 97.4 14.6 88.3 30 93.8 30 100.2 19.1 106.6 30 111 30 102.7 14.6 111.9 0 106.3 0Z" />
                </svg>
              </div>
              <div className="logo-item" title="NVIDIA">
                <svg width="110" height="24" viewBox="0 0 120 28" fill="#ffffff">
                  <path d="M12.2,2.3c-5.4,0-9.8,4.4-9.8,9.8s4.4,9.8,9.8,9.8c1.6,0,3.1-0.4,4.5-1.1l-1.3-1.3c-1,0.5-2.1,0.7-3.2,0.7c-4.4,0-8-3.6-8-8c0-4.4,3.6-8,8-8s8,3.6,8,8c0,1-0.2,2.1-0.7,3l1.3,1.3c0.7-1.3,1.1-2.8,1.1-4.4C22,6.7,17.6,2.3,12.2,2.3z M12.2,6.8c-2.9,0-5.3,2.4-5.3,5.3s2.4,5.3,5.3,5.3c0.7,0,1.4-0.1,2-0.4l-1.2-1.2c-0.3,0.1-0.5,0.1-0.8,0.1c-2,0-3.6-1.6-3.6-3.6s1.6-3.6,3.6-3.6c2,0,3.6,1.6,3.6,3.6c0,0.3-0.0,0.5-0.1,0.8l1.2,1.2c0.3-0.6,0.5-1.3,0.5-2C17.5,9.2,15.1,6.8,12.2,6.8z" />
                  <text x="35" y="18" style={{fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', letterSpacing: '4px'}}>NVIDIA</text>
                </svg>
              </div>
              <div className="logo-item" title="Meta">
                <svg width="100" height="24" viewBox="0 0 110 24" fill="#ffffff">
                  <path d="M16.5 6.5c-1.8 0-3.3.9-4.5 2.1-1.2-1.2-2.7-2.1-4.5-2.1-3.3 0-6 2.7-6 6s2.7 6 6 6c1.8 0 3.3-.9 4.5-2.1 1.2 1.2 2.7 2.1 4.5 2.1 3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10c-1.4 0-2.6-.9-3.5-2.1 1.1-1.5 1.1-3.9 0-5.4.9-1.2 2.1-2.1 3.5-2.1 2.2 0 4 1.8 4 4s-1.8 4-4 4zm-9 0c-2.2 0-4-1.8-4-4s1.8-4 4-4c1.4 0 2.6.9 3.5 2.1-1.1 1.5-1.1 3.9 0 5.4-.9 1.2-2.1 2.1-3.5 2.1z" transform="scale(0.8) translate(0, 4)" />
                  <text x="35" y="18" style={{fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.5px'}} fill="#ffffff">Meta</text>
                </svg>
              </div>
            </div>
          </section>

          {/* Marquee Divider */}
          <div className="marquee-wrapper">
            <div className="marquee-content">
              <span>OBJECTION HANDLING</span>
              <span className="dot">•</span>
              <span>SEMANTIC PARSING</span>
              <span className="dot">•</span>
              <span>ATS INTELLIGENCE</span>
              <span className="dot">•</span>
              <span>EXECUTIVE FORMATTING</span>
              <span className="dot">•</span>
              <span>PIXEL PERFECT TYPOGRAPHY</span>
              <span className="dot">•</span>
              <span>OBJECTION HANDLING</span>
              <span className="dot">•</span>
              <span>SEMANTIC PARSING</span>
              <span className="dot">•</span>
              <span>ATS INTELLIGENCE</span>
              <span className="dot">•</span>
              <span>EXECUTIVE FORMATTING</span>
              <span className="dot">•</span>
              <span>PIXEL PERFECT TYPOGRAPHY</span>
            </div>
          </div>

          {/* AI Features Section */}
          <section className="shader-work reveal" id="features">
            <h2 className="section-label">Toolkit Overview</h2>
            <p className="work-desc">Advanced Semantic Parsing and Output Generation.</p>
            <div className="features-grid">
              <div className="feature-block reveal delay-1">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm1.5-3.5a1.5 1.5 0 0 0-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5 1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5z" />
                  </svg>
                </div>
                <h3>01. Semantic Matcher</h3>
                <p>We analyze your target job description against your background to highlight the perfect linguistic overlap, overriding ATS filters.</p>
              </div>
              <div className="feature-block reveal delay-2">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
                    <path d="M7 8h10M7 12h10M7 16h6" />
                  </svg>
                </div>
                <h3>02. Executive Formatting</h3>
                <p>No generic templates. Built with clean, minimalist typography optimized for human recruiters and high-level decision makers.</p>
              </div>
              <div className="feature-block reveal delay-3">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15h6M12 12v6" />
                  </svg>
                </div>
                <h3>03. Instant Deployment</h3>
                <p>Modify, regenerate, and export absolute perfect pixel PDFs without navigating clumsy drag-and-drop builders.</p>
              </div>
            </div>
          </section>

          {/* About Us Section */}
          <section className="shader-about reveal" id="about-us">
            <div className="about-inner">
              <h1 className="about-heading">
                Making Career Storytelling More <br />
                <em>Playful, Powerful, and Alive.</em>
              </h1>
              <div className="about-columns">
                <div className="about-text">
                  <p>
                    ResumeForge is a creative development studio specialized in building interactive AI solutions for ambitious job seekers. Serious about careers, based on the web, and working with professionals worldwide.
                  </p>
                  <p>
                    Plugged into the future. While we're a targeted AI tool, we have a network of capabilities: ATS parsers, semantic matchers, and language models, ready to plug in with an array of skills.
                  </p>
                  <p>
                    This modular approach means we can scale and adapt to each application. Whether it's a FAANG engineering role, an executive position, or a creative portfolio, we help bold candidates stand out across every screening system.
                  </p>
                </div>
                <div className="about-text">
                  <p>
                    We build resumes that demand attention and reward curiosity. We push digital recruitment to places you haven't seen before, and have fun doing it. Beyond automation, we offer high-fidelity pdf design, typography, semantic tuning, and creative consulting.
                  </p>
                  <p>
                    Whether it's passing a rigid ATS scanner, launching a new career transition, or bringing a stagnant profile to life, ResumeForge bridges the gap between ambition and technical execution. Our process is hands-on, collaborative, and tailored for candidates that value craft. We're not your regular resume writer. We don't troubleshoot printers.
                  </p>
                </div>
              </div>
            </div>
            
            {/* The "Paper" Corporate Division */}
            <div className="corporate-division reveal">
              <div className="rainbow-divide"></div>
              <div className="corporate-inner">
                <p className="pitch-text">
                  In today's fast-paced corporate landscape, you need a partner who understands the bottom line. At ResumeForge, we engineer success through strategic precision and mutual profitability. Our AI is ready to synergize with your background, unlock new verticals, and maximize your interview ROI. We don't just generate text; we deliver results that compound.
                </p>
                <br />
                <p className="pitch-text">
                  We leverage state-of-the-art technology to give your profile a decisive competitive advantage. We provide turnkey optimization that scales. We merge high-performance parsing with executive-level design to build assets that appreciate your market value.
                </p>
              </div>
            </div>
          </section>

          {/* CTA / Footer Section */}
          <section className="shader-footer reveal" id="contact">
             <div className="rainbow-divide reverse"></div>
             <div className="footer-content">
               <h2 className="footer-pitch">Ready to take your enterprise to the next level?</h2>
               <p className="footer-subpitch">
                 Don't waste valuable time. Review our platform, crunch the numbers, and you'll see the trajectory points one way: up. Pick up the phone, send a fax, or schedule a consultation. The future of your career is waiting. <strong>Let's execute.</strong>
               </p>
               <div className="footer-actions">
                 <button className="book-call-large" onClick={onEnter}>Launch Protocol ↗</button>
               </div>

               <div className="footer-bottom">
                 <div className="footer-col">
                   <span>Let's interface, call us today!</span>
                   <a href="mailto:hello@resumeforge.ai">hello@resumeforge.ai</a>
                 </div>
                 <div className="footer-col">
                   <a href="#" className="footer-link"><span className="link-dot"></span> LinkedIn</a>
                   <a href="#" className="footer-link"><span className="link-dot"></span> Instagram</a>
                   <a href="#" className="footer-link"><span className="link-dot"></span> X (Twitter)</a>
                 </div>
                 <div className="footer-col right">
                   <span>Reach out today to our CEO</span>
                   <a href="mailto:ceo@resumeforge.ai">ceo@resumeforge.ai</a>
                   <a href="#" className="footer-link small mt-4">Accessibility Statement</a>
                 </div>
               </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
