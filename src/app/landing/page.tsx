"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

    return () => {
      window.removeEventListener('scroll', handleScroll);
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
          /* background, border-radius, border, transition are from original .faq-item */
          background: rgba(255, 255, 255, 0.15);
          border-radius: 15px !important; /* Ensure this radius is used */
          border: 1px solid rgba(255, 255, 255, 0.1) !important; /* Ensure this border is used */
          padding: 0 !important; /* Remove AccordionItem default padding; rely on inner elements or original .faq-item padding */
          margin-bottom: 20px; /* Add original gap between items, was on .faq-items previously implicitly */
          transition: transform 0.3s ease, background 0.3s ease;
        }
        /* shadcn AccordionItem has a border-bottom by default, remove it to use the .faq-item's own border */
        .faq-item[data-state="open"], .faq-item[data-state="closed"] {
            border-bottom-width: 0px !important;
        }


        .faq-item:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.2);
        }

        .faq-question { /* This class is on AccordionTrigger */
          font-weight: 600;
          font-size: 1.1rem;
          color: white;
          line-height: 1.4;
          text-align: left; 
          width: 100%; 
          padding: 20px !important; /* Add padding directly to trigger, as it's the clickable area */
          margin-bottom: 0; /* Remove any margin */
        }
        
        .faq-question[data-state="open"] {
          padding-bottom: 10px !important; /* Reduce padding when open, answer will add its own top padding */
        }


        /* Style for the chevron icon in AccordionTrigger */
        .faq-question svg {
          color: white !important; 
          stroke: white !important; 
          min-width: 24px !important; /* Ensure icon has some space */
          min-height: 24px !important;
          width: 24px !important;
          height: 24px !important;
        }

        .faq-answer { /* This class is on AccordionContent */
          color: rgba(255, 255, 255, 0.9);
          padding: 0 20px 20px 20px !important; /* Add padding to content (left, right, bottom) */
          line-height: 1.6;
          font-size: 0.95rem;
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
                <Accordion type="single" collapsible className="faq-items">
                  <AccordionItem value="teacher-item-1" className="faq-item">
                    <AccordionTrigger className="faq-question">How does the AI assistant help with my daily workload without replacing me?</AccordionTrigger>
                    <AccordionContent className="faq-answer">The AI handles routine tasks like attendance tracking, report generation, and project suggestions, freeing you to focus on teaching and mentoring. You remain the central figure in education while AI amplifies your impact.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="teacher-item-2" className="faq-item">
                    <AccordionTrigger className="faq-question">Will I need technical training to use the platform?</AccordionTrigger>
                    <AccordionContent className="faq-answer">No extensive training required. The platform is designed with an intuitive interface. We provide simple onboarding tutorials and ongoing support to get you started quickly.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="teacher-item-3" className="faq-item">
                    <AccordionTrigger className="faq-question">How does the system track student progress and generate reports?</AccordionTrigger>
                    <AccordionContent className="faq-answer">The AI conducts weekly check-ins with students, monitors project milestones, and automatically generates comprehensive progress summaries for your review, saving hours of manual tracking.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="teacher-item-4" className="faq-item">
                    <AccordionTrigger className="faq-question">Can the AI suggest projects that match my curriculum requirements?</AccordionTrigger>
                    <AccordionContent className="faq-answer">Yes, the AI analyzes your curriculum and suggests industry-relevant projects that align with your learning objectives while building practical skills students need for employment.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="teacher-item-5" className="faq-item">
                    <AccordionTrigger className="faq-question">How does the attendance capture with image recognition work?</AccordionTrigger>
                    <AccordionContent className="faq-answer">Simply take the picture of your attendance register and AI automatically generates a digital version of the register saving you the time needed to convert the register data to digital excel data.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="teacher-item-6" className="faq-item">
                    <AccordionTrigger className="faq-question">Will this platform integrate with my existing grading systems?</AccordionTrigger>
                    <AccordionContent className="faq-answer">Yes, we&apos;re designed to work alongside existing systems. Data can be exported to most common formats and integrated with popular learning management systems.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
              <div className="faq-category">
                <h3 className="category-title">👨‍🎓 For Students</h3>
                <Accordion type="single" collapsible className="faq-items">
                  <AccordionItem value="student-item-1" className="faq-item">
                    <AccordionTrigger className="faq-question">What kind of real-world projects will I work on?</AccordionTrigger>
                    <AccordionContent className="faq-answer">Industry-relevant projects based on actual business challenges, from app development and data analysis to marketing campaigns and research studies that build your portfolio.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="student-item-2" className="faq-item">
                    <AccordionTrigger className="faq-question">How often will I get feedback and check-ins?</AccordionTrigger>
                    <AccordionContent className="faq-answer">The AI assistant conducts weekly check-ins to track your progress, provide guidance, and identify any roadblocks. Your teacher receives detailed summaries to provide additional support when needed.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="student-item-3" className="faq-item">
                    <AccordionTrigger className="faq-question">Will this replace my professors or work alongside them?</AccordionTrigger>
                    <AccordionContent className="faq-answer">The platform enhances your professor&apos;s ability to guide you. It provides 24/7 support for project questions while your professor focuses on deeper learning and career mentorship.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="student-item-4" className="faq-item">
                    <AccordionTrigger className="faq-question">What happens to my project data and progress reports?</AccordionTrigger>
                    <AccordionContent className="faq-answer">Your data belongs to you. All project work and progress reports can be exported for your portfolio. We maintain strict privacy standards and never share your information without consent.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
              <div className="faq-category">
                <h3 className="category-title">🤝 For Both</h3>
                <Accordion type="single" collapsible className="faq-items">
                  <AccordionItem value="both-item-1" className="faq-item">
                    <AccordionTrigger className="faq-question">How much does the platform cost?</AccordionTrigger>
                    <AccordionContent className="faq-answer">The platform is free when in Beta. Once out of beta, the pricing will be based on per user account basis. Your college will pay for it.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="both-item-2" className="faq-item">
                    <AccordionTrigger className="faq-question">What technical requirements do I need to use Project Apollo?</AccordionTrigger>
                    <AccordionContent className="faq-answer">Just a smartphone or computer with internet access. The platform works on any modern web browser - no special software or hardware required.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="both-item-3" className="faq-item">
                    <AccordionTrigger className="faq-question">How does the platform ensure data privacy and security?</AccordionTrigger>
                    <AccordionContent className="faq-answer">We use enterprise-grade encryption and follow strict data protection protocols. Your personal information and academic data are secure and never shared with third parties.</AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="both-item-4" className="faq-item">
                    <AccordionTrigger className="faq-question">What kind of support is available if I have issues?</AccordionTrigger>
                    <AccordionContent className="faq-answer">We provide 24/7 technical support via chat, email, and phone. Plus dedicated onboarding assistance and regular training sessions to ensure smooth usage.</AccordionContent>
                  </AccordionItem>
                </Accordion>
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
