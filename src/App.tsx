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
    <div className="container">
      <header className="header">
        <h1 className="header-title">JUMP AI</h1>
        <nav>
          <button className="secondary-btn" onClick={() => setAnalysisResult(null)}>Home</button>
        </nav>
      </header>

      <main>
        {!analysisResult ? (
          <div className="text-center mt-4">
            <h2>AI-powered long jump technique analysis</h2>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              Upload a side-view video of your long jump to get instant biomechanical feedback.
            </p>
            {isLocked ? (
              <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--espresso)', marginBottom: '1rem' }}>Free Quota Reached</h3>
                <p style={{ color: 'var(--text-body)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                  You've used your free biomechanical analysis. Unlock unlimited AI tracking, 3D body overlays, and pro coaching metrics with a JUMP AI PRO subscription.
                </p>
                <button className="primary-btn" style={{ width: '100%' }}>
                  UPGRADE TO PRO
                </button>
                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-body)' }}>
                  Just $9.99/mo. Cancel anytime.
                </p>
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(24,21,18,0.1)', fontSize: '0.9rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-body)' }}>Are you a Developer or Coach? <a href="#" style={{ color: 'var(--espresso)', fontWeight: 600, textDecoration: 'none' }}>Contact Us</a> for custom enterprise plans.</p>
                </div>
              </div>
            ) : (
              <VideoUploader onUploadSuccess={handleUploadSuccess} />
            )}

            {/* Massive App Info Section */}
            <div style={{ marginTop: '8rem', textAlign: 'left', animation: 'fadeIn 1s ease' }}>
              <h2 style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--espresso)' }}>INSIDE <span style={{ color: 'var(--gold-dark)' }}>JUMP AI</span></h2>
              <p style={{ textAlign: 'center', color: 'var(--text-body)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 5rem', lineHeight: 1.6 }}>
                Powered by cutting-edge computer vision and deep learning, this platform brings Olympic-level biomechanical analysis directly to your browser. No markers, no suits, just pure intelligence.
              </p>
              
              <div className="grid" style={{ gap: '2rem' }}>
                <div className="card">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                  <h3 style={{ color: 'var(--gold-dark)', fontSize: '1.8rem' }}>Real-Time Tracking</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '1.1rem' }}>
                    Utilizing blazing-fast neural networks, Jump AI tracks 33 3D anatomical landmarks in real-time right from your phone or webcam.
                  </p>
                </div>
                
                <div className="card">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
                  <h3 style={{ color: 'var(--espresso)', fontSize: '1.8rem' }}>Physics Engine</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '1.1rem' }}>
                    Our custom heuristics engine calculates joint angles, hip velocities, and center of mass trajectories to pinpoint precisely where you're losing distance.
                  </p>
                </div>
                
                <div className="card">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                  <h3 style={{ color: 'var(--gold-dark)', fontSize: '1.8rem' }}>Pro Coaching</h3>
                  <p style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '1.1rem' }}>
                    Beyond just raw data, the AI translates complex physics into actionable coaching. Get customized drills and the "Top Fix" to immediately add inches to your next jump.
                  </p>
                </div>
              </div>

              <div className="card" style={{ marginTop: '8rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '3rem' }}>Built for Champions.</h2>
                <p style={{ fontSize: '1.3rem', color: 'var(--text-body)', marginBottom: '3rem' }}>
                  A seamless fusion of sports science, artificial intelligence, and beautiful design.
                </p>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.8)', padding: '1.5rem 4rem', borderRadius: '100px', border: '1px solid rgba(24,21,18,0.1)', fontSize: '1.2rem', boxShadow: '0 10px 20px rgba(24,21,18,0.05)' }}>
                  Made with <span style={{ color: 'var(--espresso)' }}>🤍</span> by <strong style={{ color: 'var(--gold-dark)', letterSpacing: '4px', marginLeft: '10px' }}>AVIROOP GHOSH</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnalysisView result={analysisResult} onBack={() => setAnalysisResult(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
