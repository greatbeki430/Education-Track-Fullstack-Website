import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/homepage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Hero section slides
  const slides = [
    {
      title: "Welcome to EduTrack Ultimate",
      subtitle:
        "Complete School Management System for Meskerem Secondary School",
      description:
        "Streamline grade management, attendance tracking, online exams, and school communication - all in one place.",
      icon: "📚",
      color: "#1e466e",
    },
    {
      title: "Digital Gradebook",
      subtitle: "Track student performance effortlessly",
      description:
        "Record scores, calculate averages automatically, and generate professional reports with one click.",
      icon: "📊",
      color: "#2c7da0",
    },
    {
      title: "Online Examinations",
      subtitle: "Create and conduct exams with automatic timers",
      description:
        "AI-powered question generation, auto-grading, and instant results for students.",
      icon: "📖",
      color: "#61a5c2",
    },
    {
      title: "Smart TV Display",
      subtitle: "Automatic announcements on Teachers' Dining Hall TV",
      description:
        "Important notices displayed automatically during lunch hours (5 PM - 8 PM).",
      icon: "📺",
      color: "#89c2d9",
    },
  ];

  // Features list
  const features = [
    {
      icon: "📝",
      title: "Digital Gradebook",
      description:
        "Easy score entry, automatic calculations, and multiple export formats",
      color: "#1e466e",
    },
    {
      icon: "📋",
      title: "Attendance Tracking",
      description: "Daily attendance with reports and analytics",
      color: "#2c7da0",
    },
    {
      icon: "📖",
      title: "Online Exams",
      description: "Timed exams with auto-grading and instant results",
      color: "#61a5c2",
    },
    {
      icon: "🤖",
      title: "AI Question Generator",
      description: "Generate exam questions from any document automatically",
      color: "#89c2d9",
    },
    {
      icon: "📢",
      title: "Smart Announcements",
      description: "Post once, display everywhere - including TV",
      color: "#a9d6e5",
    },
    {
      icon: "📺",
      title: "TV Integration",
      description: "Automatic announcement display on dining hall TV",
      color: "#01497c",
    },
    {
      icon: "📊",
      title: "Analytics & Reports",
      description: "Export data to PDF, Excel, Word, and CSV formats",
      color: "#1e466e",
    },
    {
      icon: "👥",
      title: "Student Portal",
      description: "Students view grades, attendance, and exam results",
      color: "#2c7da0",
    },
  ];

  // Stats counter animation
  const stats = [
    { label: "Active Students", value: 250, suffix: "+", icon: "🎓" },
    { label: "Teachers", value: 18, suffix: "", icon: "👨‍🏫" },
    { label: "Exams Created", value: 45, suffix: "+", icon: "📝" },
    { label: "Hours Saved", value: 100, suffix: "+", icon: "⏰" },
  ];

  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Auto-rotate slides
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    // Animate counters when stats section comes into view
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
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#stats">Impact</a>
          </div>
          <button onClick={handleLogin} className="login-btn">
            <span>🔐</span> Login
          </button>
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
              Get Started <span>→</span>
            </button>
            <a href="#features" className="btn-secondary">
              Learn More <span>↓</span>
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
            <span className="section-badge">Features</span>
            <h2>Everything You Need to Manage Your School</h2>
            <p>A complete solution for modern education management</p>
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
                    background: `${feature.color}20`,
                    color: feature.color,
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
            <span className="section-badge">Simple Process</span>
            <h2>How EduTrack Ultimate Works</h2>
            <p>Three simple steps to transform your school management</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">👨‍💼</div>
              <h3>Admin Setup</h3>
              <p>
                School administrator sets up teachers, students, and classes in
                minutes
              </p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">👨‍🏫</div>
              <h3>Teacher Dashboard</h3>
              <p>
                Teachers manage grades, attendance, and create online exams
                easily
              </p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">🎓</div>
              <h3>Student Access</h3>
              <p>
                Students view grades, take exams, and stay informed via student
                portal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2>Trusted by Educators</h2>
            <p>See what teachers and administrators are saying</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">
                This system has saved me hours of manual grade calculation. The
                AI exam generator is a game-changer!
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍🏫</div>
                <div className="author-info">
                  <h4>Abebe Kebede</h4>
                  <p>ICT Teacher, Grade 11</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">
                The TV announcement feature is brilliant. Teachers never miss
                important updates during lunch hours.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍🏫</div>
                <div className="author-info">
                  <h4>Bekele Alemu</h4>
                  <p>Head Teacher</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">
                Students love being able to check their grades and attendance
                anytime through the student portal.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍🎓</div>
                <div className="author-info">
                  <h4>Chaltu Mohammed</h4>
                  <p>Grade 11 Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your School Management?</h2>
            <p>
              Join Meskerem Secondary School in embracing digital education
              management
            </p>
            <button onClick={handleLogin} className="cta-btn">
              Login to Dashboard <span>→</span>
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
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#stats">Impact</a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Login
              </a>
            </div>
            <div className="footer-info">
              <p>Meskerem Secondary School - Communities</p>
              <p>Addis Ababa, Ethiopia</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 EduTrack Ultimate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
