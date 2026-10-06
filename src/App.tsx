import { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import AnalysisView from './components/AnalysisView';

function App() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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
            <VideoUploader onUploadSuccess={(res) => setAnalysisResult(res)} />

            {/* Massive App Info Section */}
            <div style={{ marginTop: '6rem', textAlign: 'left', animation: 'fadeIn 1s ease' }}>
              <h2 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--accent-dark)' }}>INSIDE <span style={{ color: 'var(--accent-gold)' }}>JUMP AI</span></h2>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
                Powered by cutting-edge computer vision and deep learning, this platform brings Olympic-level biomechanical analysis directly to your browser. No markers, no suits, just pure intelligence.
              </p>
              
              <div className="grid" style={{ gap: '2rem' }}>
                <div className="card">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                  <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Real-Time Tracking</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                    Utilizing blazing-fast neural networks, Jump AI tracks 33 3D anatomical landmarks in real-time right from your phone or webcam.
                  </p>
                </div>
                
                <div className="card">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
                  <h3 style={{ color: 'var(--accent-dark)', fontSize: '1.5rem' }}>Physics Engine</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                    Our custom heuristics engine calculates joint angles, hip velocities, and center of mass trajectories to pinpoint precisely where you're losing distance.
                  </p>
                </div>
                
                <div className="card">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                  <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Pro Coaching</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                    Beyond just raw data, the AI translates complex physics into actionable coaching. Get customized drills and the "Top Fix" to immediately add inches to your next jump.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '6rem', marginBottom: '2rem', padding: '4rem 2rem', background: 'var(--card-bg)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid var(--card-border)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>Built for Champions.</h2>
                <p style={{ fontSize: '1.3rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
                  A seamless fusion of sports science, artificial intelligence, and beautiful design.
                </p>
                <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.03)', padding: '1.5rem 4rem', borderRadius: '50px', border: '1px solid var(--border-color)', fontSize: '1.2rem' }}>
                  Made with <span style={{ color: 'var(--accent-dark)' }}>🤍</span> by <strong style={{ color: 'var(--accent-gold)', letterSpacing: '3px', marginLeft: '10px' }}>AVIROOP GHOSH</strong>
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
