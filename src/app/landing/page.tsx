import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Sticky Top Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Logo</h1>
        </div>
        <div>
          <Link href="/login" passHref>
            <button style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              color: '#fff',
              backgroundColor: '#007bff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}>
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ padding: '2rem' }}>
        {/* Key Features Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Key Features</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Automating mundane admin work, such as attendance capture with image and excelsheet generation.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Enhancing practical learning by helping teachers engaging students with real world problem statement.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Autonomous Teacher Assistant - context aware, aiding in project planning, regular weekly checkins with students and prepare summary for teachers.
            </li>
          </ul>
        </section>

        {/* The Challenge Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>The Challenge (Reasons for this website)</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '0.5rem' }}>Teachers are not up to date with the industry trends. 😟</li>
            <li style={{ marginBottom: '0.5rem' }}>Students work on mundane projects with no real connection.</li>
            <li style={{ marginBottom: '0.5rem' }}>Theory heavy teaching is Boring. 🥱</li>
            <li style={{ marginBottom: '0.5rem' }}>Lack of 1-1 teacher student mentorship. 🧭</li>
          </ul>
        </section>

        {/* AI-Powered Solution Section */}
        <section>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>AI-Powered Solution for Real Impact.</h2>
          <p>
            Placeholder text for AI-Powered Solution: Our platform leverages cutting-edge AI to bridge the gap between academic learning and real-world application, fostering innovation and preparing students for the future.
          </p>
        </section>
      </main>
    </div>
  );
}
