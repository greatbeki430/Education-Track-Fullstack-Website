import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "../translations/homepage";
import "../styles/homepage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");

  // Get current language translations
  const t = translations[language];

  // Hero section slides
  const slides = t.slides;

  // Features list
  const features = t.features.items;

  // Stats counter animation
  const stats = [
    { label: t.stats.students, value: 250, suffix: "+", icon: "🎓" },
    { label: t.stats.teachers, value: 18, suffix: "", icon: "👨‍🏫" },
    { label: t.stats.exams, value: 45, suffix: "+", icon: "📝" },
    { label: t.stats.hours, value: 100, suffix: "+", icon: "⏰" },
  ];

  const [counters, setCounters] = useState(stats.map(() => 0));

  // Language options
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧", label: "English" },
    { code: "am", name: "አማርኛ", flag: "🇪🇹", label: "አማርኛ" },
    { code: "om", name: "Oromo", flag: "🇪🇹", label: "Afaan Oromo" },
  ];

  // Save language preference to localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem("preferredLanguage", langCode);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on window resize (if screen becomes larger)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stats.forEach((stat, idx) => {
              let start = 0;
              const end = stat.value;
              const duration = 2000;
              const step = end / (duration / 16);
              const timer = setInterval(() => {
                start += step;
                if (start >= end) {
                  clearInterval(timer);
                  setCounters((prev) => {
                    const newCounters = [...prev];
                    newCounters[idx] = end;
                    return newCounters;
                  });
                } else {
                  setCounters((prev) => {
                    const newCounters = [...prev];
                    newCounters[idx] = Math.floor(start);
                    return newCounters;
                  });
                }
              }, 16);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );

    const statsSection = document.querySelector(".stats-section");
    if (statsSection) observer.observe(statsSection);
  }, []);

  const handleLogin = () => {
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className={`home-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">
              EduTrack<span className="logo-highlight">Ultimate</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-links">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
            >
              {t.nav.features}
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
            >
              {t.nav.howItWorks}
            </a>
            <a
              href="#stats"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("stats");
              }}
            >
              {t.nav.impact}
            </a>
          </div>

          <div className="nav-right">
            {/* Language Selector */}
            <div className="language-selector">
              <button className="lang-btn">
                <span>{languages.find((l) => l.code === language)?.flag}</span>
                <span className="lang-name">
                  {languages.find((l) => l.code === language)?.name}
                </span>
                <span className="lang-arrow">▼</span>
              </button>
              <div className="lang-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`lang-option ${language === lang.code ? "active" : ""}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleLogin} className="login-btn">
              <span>🔐</span> {t.nav.login}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className={`mobile-menu-toggle ${mobileMenuOpen ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav-menu ${mobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-nav-links">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
            >
              <span>📊</span> {t.nav.features}
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
            >
              <span>⚙️</span> {t.nav.howItWorks}
            </a>
            <a
              href="#stats"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("stats");
              }}
            >
              <span>📈</span> {t.nav.impact}
            </a>
            <button onClick={handleLogin} className="mobile-login-btn">
              <span>🔐</span> {t.nav.login}
            </button>
            <div className="mobile-language-section">
              <p className="mobile-language-label">
                🌐 Language / ቋንቋ / Afaan:
              </p>
              <div className="mobile-language-options">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`mobile-lang-option ${language === lang.code ? "active" : ""}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Carousel */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="carousel-container">
            <div
              className="carousel-slides"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="carousel-slide">
                  <div className="slide-icon">{slide.icon}</div>
                  <h1 className="slide-title">{slide.title}</h1>
                  <p className="slide-subtitle">{slide.subtitle}</p>
                  <p className="slide-description">{slide.description}</p>
                </div>
              ))}
            </div>
            <div className="carousel-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${currentSlide === index ? "active" : ""}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
          <div className="hero-buttons">
            <button onClick={handleLogin} className="btn-primary">
              {t.buttons.getStarted} <span>→</span>
            </button>
            <a
              href="#features"
              className="btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
            >
              {t.buttons.learnMore} <span>↓</span>
            </a>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">{t.features.badge}</span>
            <h2>{t.features.title}</h2>
            <p>{t.features.subtitle}</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="feature-icon"
                  style={{
                    background: `${
                      [
                        "#1e466e",
                        "#2c7da0",
                        "#61a5c2",
                        "#89c2d9",
                        "#a9d6e5",
                        "#01497c",
                        "#1e466e",
                        "#2c7da0",
                      ][index]
                    }20`,
                    color: [
                      "#1e466e",
                      "#2c7da0",
                      "#61a5c2",
                      "#89c2d9",
                      "#a9d6e5",
                      "#01497c",
                      "#1e466e",
                      "#2c7da0",
                    ][index],
                  }}
                >
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">
                  {counters[index]}
                  {stat.suffix}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">{t.howItWorks.badge}</span>
            <h2>{t.howItWorks.title}</h2>
            <p>{t.howItWorks.subtitle}</p>
          </div>
          <div className="steps-container">
            {t.howItWorks.steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="step">
                  <div className="step-number">{step.number}</div>
                  <div className="step-icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {idx < t.howItWorks.steps.length - 1 && (
                  <div className="step-arrow">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">{t.testimonials.badge}</span>
            <h2>{t.testimonials.title}</h2>
            <p>{t.testimonials.subtitle}</p>
          </div>
          <div className="testimonials-grid">
            {t.testimonials.items.map((item, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{item.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{item.avatar}</div>
                  <div className="author-info">
                    <h4>{item.author}</h4>
                    <p>{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{t.cta.title}</h2>
            <p>{t.cta.subtitle}</p>
            <button onClick={handleLogin} className="cta-btn">
              {t.cta.button} <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">📚</span>
              <span>EduTrack Ultimate</span>
            </div>
            <div className="footer-links">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
              >
                {t.nav.features}
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("how-it-works");
                }}
              >
                {t.nav.howItWorks}
              </a>
              <a
                href="#stats"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("stats");
                }}
              >
                {t.nav.impact}
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                {t.nav.login}
              </a>
            </div>
            <div className="footer-info">
              <p>{t.footer.school}</p>
              <p>{t.footer.address}</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 {t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
