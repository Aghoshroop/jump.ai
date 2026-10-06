import React, { useRef } from 'react';

interface Props {
  result: any;
  onBack: () => void;
}

const AnalysisView: React.FC<Props> = ({ result, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!result) {
      return null;
  }

  const videoSrc = result.original_video_url;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button className="primary-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)' }}>
            ← Analyze Another Jump
        </button>
      </div>
      <div className="video-container">
        <video 
            ref={(el) => {
                if (el) el.playbackRate = 0.25; // SLOW MOTION
                // @ts-ignore
                videoRef.current = el;
            }}
            src={videoSrc}
            className="video-element" 
            controls 
            autoPlay
            loop
            crossOrigin="anonymous"
        />
      </div>

      <div className="mt-4" style={{ paddingTop: '2rem' }}>
        <h2 className="text-center" style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Analysis Complete</h2>
        
        <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>PHASE BREAKDOWN</h3>
        <div className="grid" style={{ marginBottom: '4rem' }}>
            {Object.entries(result.phases || {}).map(([phaseName, phaseData]: [string, any]) => (
                <div key={phaseName} className="card phase-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {phaseData.image_url && (
                        <div style={{ width: '100%', height: '180px', backgroundImage: `url(${phaseData.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    )}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h4 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '1.2rem' }}>{phaseName}</h4>
                                <span style={{ background: 'rgba(247, 197, 72, 0.15)', color: 'var(--accent-gold)', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                                    {result.phase_scores?.[phaseName] || 'N/A'}
                                </span>
                            </div>
                            
                            {result.metrics?.[phaseName] && (
                                <div className="mt-4" style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {Object.entries(result.metrics[phaseName]).map(([mName, mVal]: [string, any]) => (
                                        <div key={mName} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{mName.replace(/_/g, ' ')}</span>
                                            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{mVal}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <button className="secondary-btn mt-4" style={{ width: '100%' }}
                            onClick={() => {
                                if (videoRef.current) {
                                    videoRef.current.currentTime = phaseData.timestamp;
                                    videoRef.current.pause();
                                    videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }}
                        >
                            Go to Video Frame
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex" style={{ gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem', width: '100%' }}>
            <div className="card text-center" style={{ flex: '1 1 300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                <div className="score-circle">{result.overall_score}</div>
                <h3 style={{ margin: 0, color: 'var(--text-muted)', letterSpacing: '4px' }}>OVERALL SCORE</h3>
            </div>
            
            {result.coaching && (
                <div className="card" style={{ flex: '2 1 300px', maxWidth: '100%', background: 'linear-gradient(145deg, rgba(255, 107, 53, 0.1), transparent)', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        <h3 style={{ margin: 0, color: 'var(--accent-orange)' }}>TOP FIX</h3>
                    </div>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3, wordWrap: 'break-word' }}>"{result.coaching.top_fix}"</p>
                    <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, wordWrap: 'break-word' }}><strong>Why:</strong> {result.coaching.why}</p>
                    <div className="mt-4" style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)', wordWrap: 'break-word' }}>
                        <p style={{ margin: 0 }}><strong>Try this drill:</strong> {result.coaching.drill}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
