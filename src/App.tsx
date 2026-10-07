import { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import AnalysisView from './components/AnalysisView';

function App() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('jump_ai_used') === 'true') {
      setIsLocked(true);
    }
    
    // Secret bypass listener
    let keySequence = '';
    const secretCode = 'aviroop';
    const handleKeyDown = (e: KeyboardEvent) => {
      keySequence += e.key.toLowerCase();
      if (keySequence.length > secretCode.length) {
        keySequence = keySequence.slice(-secretCode.length);
      }
      if (keySequence === secretCode) {
        localStorage.removeItem('jump_ai_used');
        setIsLocked(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUploadSuccess = (res: any) => {
    setAnalysisResult(res);
    localStorage.setItem('jump_ai_used', 'true');
    setIsLocked(true);
  };

  return (
    <div className="app-wrapper">
      {!analysisResult ? (
        <>
          {/* 1. HERO SECTION */}
          <section className="hero-section">
            <nav className="top-nav">
              <div className="logo">JUMP<span>AI</span></div>
            </nav>
            <div className="hero-content" style={{ animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <h1 className="hero-title">ELEVATE<br/>YOUR FLIGHT</h1>
              <p className="hero-subtitle">Olympic-tier biomechanics analysis, directly in your browser. No markers. No suits. Just pure intelligence.</p>
            </div>
            <div className="scroll-indicator" onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}>
              ↓ INITIATE ANALYSIS ↓
            </div>
          </section>

          {/* 2. UPLOAD SECTION */}
          <section className="upload-section" id="upload">
            <div className="container text-center">
              <h2 className="section-title" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: 'var(--gold-dark)', letterSpacing: '4px' }}>STEP 01 &nbsp;—&nbsp; CAPTURE</h2>
              <h3 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', marginBottom: '1rem' }}>Upload your jump.</h3>
              <p className="section-desc" style={{ padding: '0 1rem' }}>Provide a clear, side-profile video of your long jump attempt.</p>
              
              {isLocked ? (
                <div className="card" style={{ maxWidth: '650px', margin: '2rem auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', marginBottom: '1.5rem' }}>🔒</div>
                  <h3 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: 'var(--espresso)', marginBottom: '1rem' }}>Free Quota Reached</h3>
                  <p style={{ color: 'var(--text-body)', fontSize: 'clamp(1rem, 3vw, 1.15rem)', marginBottom: '2.5rem', lineHeight: '1.7' }}>
                    You've utilized your complimentary biomechanical analysis. Unlock unlimited AI tracking, 3D body overlays, and pro coaching metrics with a JUMP AI PRO subscription.
                  </p>
                  <button className="primary-btn" style={{ width: '100%', padding: '16px' }}>
                    UPGRADE TO PRO
                  </button>
                  <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-body)' }}>
                    Just $9.99/mo. Cancel anytime.
                  </p>
                  <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(24,21,18,0.1)', fontSize: '0.95rem' }}>
                    <p style={{ margin: 0, color: 'var(--text-body)' }}>Are you a Developer or Coach? <a href="#" style={{ color: 'var(--espresso)', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid var(--espresso)' }}>Contact Us</a> for custom enterprise plans.</p>
                  </div>
                </div>
              ) : (
                <VideoUploader onUploadSuccess={handleUploadSuccess} />
              )}
            </div>
          </section>

          {/* 3. ENGINE INFO SECTION */}
          <section className="engine-section">
            <div className="container">
              <div className="text-center" style={{ marginBottom: '4rem' }}>
                <h2 className="section-title" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: 'var(--gold-dark)', letterSpacing: '4px' }}>THE ENGINE</h2>
                <h3 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', margin: 0 }}>Built for Champions.</h3>
              </div>
              
              <div className="grid engine-grid">
                <div className="card engine-card">
                  <div className="engine-icon">⚡</div>
                  <h3 className="engine-card-title">Real-Time Tracking</h3>
                  <p className="engine-card-desc">
                    Utilizing blazing-fast neural networks, Jump AI tracks 33 3D anatomical landmarks in real-time, right from your phone or webcam.
                  </p>
                </div>
                
                <div className="card engine-card">
                  <div className="engine-icon">🧠</div>
                  <h3 className="engine-card-title">Physics Engine</h3>
                  <p className="engine-card-desc">
                    Our custom heuristics calculate joint angles, hip velocities, and center of mass trajectories to pinpoint precisely where you're losing distance.
                  </p>
                </div>
                
                <div className="card engine-card">
                  <div className="engine-icon">📈</div>
                  <h3 className="engine-card-title">Pro Coaching</h3>
                  <p className="engine-card-desc">
                    Beyond just raw data, the AI translates complex physics into actionable coaching. Get customized drills and the "Top Fix" to immediately add inches.
                  </p>
                </div>
              </div>
              
              <div className="footer-credit">
                Made with 🤍 by <strong>AVIROOP GHOSH</strong>
              </div>
            </div>
          </section>
        </>
      ) : (
        <AnalysisView result={analysisResult} onBack={() => setAnalysisResult(null)} />
      )}
    </div>
  );
}

export default App;
