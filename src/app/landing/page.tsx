"use client";

import Link from 'next/link';
import { useEffect } from 'react';

export default function LandingPage() {

  useEffect(() => {
    // Add subtle animation on scroll
    const handleScroll = () => {
      const cards = document.querySelectorAll('.stat-card, .feature-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
          (card as HTMLElement).style.opacity = '1';
          (card as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    // Initialize cards with fade-in effect
    const cards = document.querySelectorAll('.stat-card, .feature-card');
    cards.forEach((card, index) => {
      const element = card as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 200);
    });

    // FAQ Accordion Logic
    const faqQuestions = document.querySelectorAll<HTMLButtonElement>('.faq-question');
    const allFaqAnswers = document.querySelectorAll<HTMLElement>('.faq-answer');

    faqQuestions.forEach(questionButton => {
      questionButton.addEventListener('click', (event) => {
        console.log("FAQ question clicked:", event.currentTarget); // Existing debug log
        event.preventDefault(); // Good practice for buttons

        const buttonElement = event.currentTarget as HTMLButtonElement; // More specific type
        const currentIcon = buttonElement.querySelector('.faq-icon') as HTMLElement;

        if (currentIcon) {
          let newIconText = '';
          if (currentIcon.textContent === '+') {
            newIconText = '-';
            currentIcon.textContent = newIconText;
            // currentIcon.classList.add('open'); // Also ensure class for CSS rotation is handled if needed
          } else {
            newIconText = '+';
            currentIcon.textContent = newIconText;
            // currentIcon.classList.remove('open'); 
          }
          console.log("Icon should change to:", newIconText);
        }

        // const currentAnswer = questionButton.nextElementSibling as HTMLElement;
        // const isCurrentlyOpen = currentAnswer.style.maxHeight && currentAnswer.style.maxHeight !== '0px';

        // // Close all other answers and reset icons
        // allFaqAnswers.forEach(answer => {
        //   if (answer !== currentAnswer) {
        //     answer.style.maxHeight = '0px';
        //     answer.classList.remove('open');
        //     const otherIcon = answer.previousElementSibling?.querySelector('.faq-icon') as HTMLElement | null;
        //     if (otherIcon) {
        //       // otherIcon.textContent = '+'; // Logic was here previously
        //       // otherIcon.classList.remove('open');
        //     }
        //   }
        // });
        
        // // Toggle current answer
        // if (isCurrentlyOpen) {
        //   currentAnswer.style.maxHeight = '0px';
        //   currentAnswer.classList.remove('open');
        //   // Icon logic was here
        // } else {
        //   // --- Start of potential fix for scrollHeight calculation ---
        //   currentAnswer.style.visibility = 'hidden';
        //   currentAnswer.style.display = 'block'; 
        //   currentAnswer.style.maxHeight = 'auto'; 
        //   const height = currentAnswer.scrollHeight;
        //   currentAnswer.style.visibility = ''; 
        //   currentAnswer.style.display = '';   
        //   currentAnswer.style.maxHeight = '0px'; 
        //   void currentAnswer.offsetWidth; 
        //   // --- End of potential fix ---
        //   currentAnswer.style.maxHeight = height + 'px';
        //   currentAnswer.classList.add('open');
        //   // Icon logic was here
        // }
      });
    });


    return () => {
      window.removeEventListener('scroll', handleScroll);
      // TODO: Consider removing FAQ event listeners if component can unmount and remount frequently,
      // though for a landing page, this might be less critical.
      // faqQuestions.forEach(button => button.removeEventListener('click', ...));
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding-top: 80px;
        }

        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 15px 20px;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .topbar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .topbar-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #2c3e50;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .topbar-logo:hover {
          color: #667eea;
          transition: color 0.3s ease;
        }

        .topbar-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
          cursor: pointer;
          border: none;
        }

        .topbar-button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          margin: 20px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .header {
          text-align: center;
          padding: 60px 40px 40px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .logo {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .tagline {
          font-size: 1.2rem;
          opacity: 0.9;
          font-weight: 300;
        }

        .problem-section {
          padding: 60px 40px;
          text-align: center;
          background: #fff;
        }

        .problem-title {
          font-size: 2.8rem;
          font-weight: 700;
          color: #e74c3c;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .problem-subtitle {
          font-size: 1.3rem;
          color: #666;
          margin-bottom: 30px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin: 40px 0;
        }

        .stat-card {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          padding: 30px 20px;
          border-radius: 15px;
          color: white;
          text-align: center;
          transform: translateY(0);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 800;
          display: block;
          margin-bottom: 10px;
        }

        .stat-text {
          font-size: 1rem;
          opacity: 0.9;
        }

        .solution-section {
          padding: 60px 40px;
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }

        .solution-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 50px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.9);
          padding: 40px 30px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: block;
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .feature-description {
          color: #666;
          line-height: 1.6;
        }

        .cta-section {
          padding: 60px 40px;
          background: #2c3e50;
          color: white;
          text-align: center;
        }

        .cta-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .cta-subtitle {
          font-size: 1.2rem;
          opacity: 0.8;
          margin-bottom: 30px;
        }

        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 18px 40px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          cursor: pointer;
          border: none;
        }

        .cta-button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
        }

        .challenges-section {
          padding: 60px 40px;
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
          position: relative;
        }

        .challenges-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
        }

        .challenges-subtitle {
          text-align: center;
          font-size: 1.3rem;
          color: #666;
          margin-bottom: 50px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .challenges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .challenge-card {
          background: rgba(255, 255, 255, 0.9);
          padding: 35px 25px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .challenge-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .challenge-icon {
          font-size: 3.5rem;
          display: block;
          margin-bottom: 20px;
        }

        .challenge-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          line-height: 1.3;
        }

        .challenge-description {
          color: #666;
          line-height: 1.6;
          font-size: 1rem;
        }

        .faq-section {
          padding: 60px 40px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .faq-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 50px;
          color: white;
        }

        .faq-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .faq-category {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .category-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 25px;
          text-align: center;
          color: white;
        }

        .faq-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .faq-item {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 15px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease, background 0.3s ease;
        }

        .faq-item:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.2);
        }

        .faq-question {
          font-weight: 600;
          font-size: 1.1rem;
          /* margin-bottom: 10px; */ /* Removed as button will handle spacing */
          color: white;
          line-height: 1.4;
          /* Added for button styling */
          background: transparent;
          border: none;
          text-align: left;
          width: 100%;
          padding: 0; /* Remove default button padding */
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .faq-question:hover {
          /* Optional: Add hover effect if desired */
          /* color: rgba(255, 255, 255, 0.8); */
        }

        .faq-icon {
          font-size: 1.2rem;
          font-weight: bold;
          transition: transform 0.3s ease-out;
          margin-left: 10px; /* Space between text and icon */

          /* --- Debugging Styles for Visibility --- */
          color: yellow !important;
          min-width: 1em !important;
          min-height: 1em !important;
          opacity: 1 !important;
          display: inline-block !important; /* Or 'block' if it makes more sense in context */
          border: 1px solid red !important;
          text-align: center; /* To center the + or - if it appears */
          line-height: 1em; /* To vertically center if min-height is affecting it */
          /* --- End Debugging Styles --- */
        }

        .faq-icon.open {
          transform: rotate(45deg); /* Rotates '+' to 'x' or similar for close */
        }

        .faq-answer {
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          font-size: 0.95rem;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
          /* margin-top: 10px; */ /* Removed: Will be applied only when open */
        }

        .faq-answer.open {
          /* max-height will be set by JS */
          margin-top: 10px; /* Apply margin only when open */
        }

        @media (max-width: 768px) {
          body {
            padding-top: 70px;
          }

          .topbar {
            padding: 12px 15px;
          }

          .topbar-logo {
            font-size: 1.3rem;
          }

          .topbar-button {
            padding: 10px 20px;
            font-size: 0.85rem;
          }

          .faq-section {
            padding: 40px 20px;
          }

          .faq-title {
            font-size: 2rem;
          }

          .faq-categories {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .faq-category {
            padding: 20px;
          }

          .challenges-section {
            padding: 40px 20px;
          }

          .challenges-title {
            font-size: 2rem;
          }

          .challenges-grid {
            grid-template-columns: 1fr;
          }

          .hero {
            margin: 10px;
          }

          .header {
            padding: 40px 20px 30px;
          }

          .logo {
            font-size: 2rem;
          }

          .problem-title {
            font-size: 2.2rem;
          }

          .solution-title {
            font-size: 2rem;
          }

          .features {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="topbar">
        <div className="topbar-content">
          <div className="topbar-logo">
            🚀 Project Apollo
          </div>
          <Link href="/login" passHref>
            <button className="topbar-button">Get Started</button>
          </Link>
        </div>
      </div>

      <div className="hero">
        <div className="header">
          <h1 className="logo" style={{ fontSize: '6em' }}>👩🏼‍🏫</h1>
          <h1 className="logo">Smart Teacher&apos;s Assistant</h1>
        </div>

        <div className="problem-section">
          <h2 className="problem-title">49% of Indian Graduates are UNEMPLOYABLE</h2>
          <p className="problem-subtitle">Half of all college graduates struggle to find employment due to lack of industry skills, practical experience, and proper guidance.</p>
          
          <div className="stats">
            <div className="stat-card">
              <span className="stat-number">57%</span>
              <span className="stat-text">Report difficulties in collaborative learning</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">45%</span>
              <span className="stat-text">Students experience higher than average stress levels</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">28%</span>
              <span className="stat-text">Struggle to understand course material</span>
            </div>
          </div>
        </div>

        <div className="challenges-section">
          <div className="container">
            <h2 className="challenges-title">Why Are Students Struggling? 🤔</h2>
            <p className="challenges-subtitle">The root causes behind the employability crisis</p>
            
            <div className="challenges-grid">
              <div className="challenge-card">
                <span className="challenge-icon">📊</span>
                <h3 className="challenge-title">Teachers Lack Industry Updates</h3>
                <p className="challenge-description">Faculty aren&apos;t equipped with current industry trends and technologies, creating a gap between classroom learning and real-world requirements.</p>
              </div>
              
              <div className="challenge-card">
                <span className="challenge-icon">🧭</span>
                <h3 className="challenge-title">Lack of 1-1 Teacher-Student Mentorship</h3>
                <p className="challenge-description">Students struggle without personalized guidance and mentorship. Large class sizes prevent meaningful individual attention and career direction.</p>
              </div>
              
              <div className="challenge-card">
                <span className="challenge-icon">🔄</span>
                <h3 className="challenge-title">Mundane, Disconnected Projects</h3>
                <p className="challenge-description">Students work on repetitive, theoretical projects with no real-world connection, missing opportunities to build practical, portfolio-worthy experience.</p>
              </div>
              
              <div className="challenge-card">
                <span className="challenge-icon">😴</span>
                <h3 className="challenge-title">Theory-Heavy Teaching is Boring</h3>
                <p className="challenge-description">Traditional lecture-based learning fails to engage students, leading to disinterest and poor retention of important concepts and skills.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="solution-section">
          <h2 className="solution-title">AI-Powered Solution for Real Impact</h2>
          <div className="features">
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3 className="feature-title">Automated Admin Work</h3>
              <p className="feature-description">Streamline mundane tasks like attendance capture with image recognition and automatic Excel sheet generation. Free up teachers&apos; time to focus on what matters most - teaching.</p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3 className="feature-title">Real-World Problem Solving</h3>
              <p className="feature-description">Enhance practical learning by connecting students with industry-relevant problem statements. Bridge the gap between classroom theory and workplace reality.</p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">🤖</span>
              <h3 className="feature-title">Autonomous Teacher Assistant</h3>
              <p className="feature-description">Context-aware AI that aids in project planning, conducts regular weekly check-ins with students, and prepares detailed progress summaries for teachers.</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2 className="cta-title">Transform Education. Empower Students.</h2>
          <p className="cta-subtitle">Join the movement to achieve 95% graduate employability through AI-enhanced teaching</p>
          <Link href="/login" passHref>
            <button className="cta-button">Get Started Today</button>
          </Link>
        </div>

        <div className="faq-section">
          <div className="container">
            <h2 className="faq-title">Frequently Asked Questions 💬</h2>
            
            <div className="faq-categories">
              <div className="faq-category">
                <h3 className="category-title">👩‍🏫 For Teachers</h3>
                <div className="faq-items">
                  <div className="faq-item">
                    <button className="faq-question">
                      How does the AI assistant help with my daily workload without replacing me?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">The AI handles routine tasks like attendance tracking, report generation, and project suggestions, freeing you to focus on teaching and mentoring. You remain the central figure in education while AI amplifies your impact.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      Will I need technical training to use the platform?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">No extensive training required. The platform is designed with an intuitive interface. We provide simple onboarding tutorials and ongoing support to get you started quickly.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      How does the system track student progress and generate reports?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">The AI conducts weekly check-ins with students, monitors project milestones, and automatically generates comprehensive progress summaries for your review, saving hours of manual tracking.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      Can the AI suggest projects that match my curriculum requirements?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">Yes, the AI analyzes your curriculum and suggests industry-relevant projects that align with your learning objectives while building practical skills students need for employment.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      How does the attendance capture with image recognition work?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">Simply take the picture of your attendance register and AI automatically generates a digital version of the register saving you the time needed to convert the register data to digital excel data.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      Will this platform integrate with my existing grading systems?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">Yes, we&apos;re designed to work alongside existing systems. Data can be exported to most common formats and integrated with popular learning management systems.</div>
                  </div>
                </div>
              </div>
              
              <div className="faq-category">
                <h3 className="category-title">👨‍🎓 For Students</h3>
                <div className="faq-items">
                  <div className="faq-item">
                    <button className="faq-question">
                      What kind of real-world projects will I work on?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">Industry-relevant projects based on actual business challenges, from app development and data analysis to marketing campaigns and research studies that build your portfolio.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      How often will I get feedback and check-ins?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">The AI assistant conducts weekly check-ins to track your progress, provide guidance, and identify any roadblocks. Your teacher receives detailed summaries to provide additional support when needed.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      Will this replace my professors or work alongside them?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">The platform enhances your professor&apos;s ability to guide you. It provides 24/7 support for project questions while your professor focuses on deeper learning and career mentorship.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      What happens to my project data and progress reports?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">Your data belongs to you. All project work and progress reports can be exported for your portfolio. We maintain strict privacy standards and never share your information without consent.</div>
                  </div>
                </div>
              </div>
              
              <div className="faq-category">
                <h3 className="category-title">🤝 For Both</h3>
                <div className="faq-items">
                  <div className="faq-item">
                    <button className="faq-question">
                      How much does the platform cost?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">The platform is free when in Beta. Once out of beta, the pricing will be based on per user account basis. Your college will pay for it.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      What technical requirements do I need to use Project Apollo?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">Just a smartphone or computer with internet access. The platform works on any modern web browser - no special software or hardware required.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      How does the platform ensure data privacy and security?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">We use enterprise-grade encryption and follow strict data protection protocols. Your personal information and academic data are secure and never shared with third parties.</div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      What kind of support is available if I have issues?
                      <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-answer">We provide 24/7 technical support via chat, email, and phone. Plus dedicated onboarding assistance and regular training sessions to ensure smooth usage.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2 className="cta-title">Transform Education. Empower Students.</h2>
          <p className="cta-subtitle">Join the movement to achieve 95% graduate employability through AI-enhanced teaching</p>
          <Link href="/login" passHref>
            <button className="cta-button">Get Started Today</button>
          </Link>
        </div>
      </div>
    </>
  );
}
