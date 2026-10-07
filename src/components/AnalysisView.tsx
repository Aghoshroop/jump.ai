import React, { useRef, useEffect } from 'react';

const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;
const drawConnectors = (window as any).drawConnectors;
const drawLandmarks = (window as any).drawLandmarks;

interface Props {
  result: any;
  onBack: () => void;
}

const AnalysisView: React.FC<Props> = ({ result, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(err => {
              console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
      } else {
          document.exitFullscreen();
      }
  };

  useEffect(() => {
      if (!result?.framesData || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationId: number;

      const render = () => {
          if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
          }

          const currentTime = video.currentTime;
          const frames = result.framesData;
          let closestFrame = frames[0];
          let minDiff = Infinity;
          
          for (let i = 0; i < frames.length; i++) {
              const diff = Math.abs(frames[i].timestamp - currentTime);
              if (diff < minDiff) {
                  minDiff = diff;
                  closestFrame = frames[i];
              }
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (closestFrame && closestFrame.landmarks && minDiff < 0.1) {
              drawConnectors(ctx, closestFrame.landmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 6 });
              drawLandmarks(ctx, closestFrame.landmarks, { color: '#FF0000', lineWidth: 4, radius: 4 });
          }
          
          animationId = requestAnimationFrame(render);
      };
      
      render();

      return () => cancelAnimationFrame(animationId);
  }, [result]);

  if (!result) {
      return null;
  }

  const videoSrc = result.original_video_url;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button className="secondary-btn" onClick={onBack}>
            ← Analyze Another Jump
        </button>
      </div>
      <div className="video-container" style={{ position: 'relative' }} ref={containerRef}>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            Enlarge AI Video
        </button>
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
            style={{ width: '100%', display: 'block' }}
        />
        <canvas 
            ref={canvasRef} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} 
        />
      </div>

      <div className="mt-4" style={{ paddingTop: '2rem' }}>
        <h2 className="text-center" style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', marginBottom: '3rem' }}>Analysis Complete</h2>
        
        <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--gold-dark)', fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>PHASE BREAKDOWN</h3>
        <div className="grid" style={{ marginBottom: '4rem' }}>
            {Object.entries(result.phases || {}).map(([phaseName, phaseData]: [string, any]) => (
                <div key={phaseName} className="card phase-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {phaseData.image_url && (
                        <div style={{ width: '100%', height: '180px', backgroundImage: `url(${phaseData.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    )}
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h4 style={{ color: 'var(--espresso)', margin: 0, fontSize: '1.4rem' }}>{phaseName}</h4>
                                <span style={{ background: 'rgba(145, 117, 64, 0.15)', color: 'var(--gold-dark)', padding: '6px 14px', borderRadius: '100px', fontWeight: '800', fontFamily: 'Syne, sans-serif' }}>
                                    {result.phase_scores?.[phaseName] || 'N/A'}
                                </span>
                            </div>
                            
                            {result.metrics?.[phaseName] && (
                                <div className="mt-4" style={{ fontSize: '1rem', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {Object.entries(result.metrics[phaseName]).map(([mName, mVal]: [string, any]) => (
                                        <div key={mName} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--sand-3)', paddingBottom: '0.5rem' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{mName.replace(/_/g, ' ')}</span>
                                            <span style={{ color: 'var(--espresso)', fontWeight: 700 }}>{mVal}</span>
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
            <div className="card text-center" style={{ flex: '1 1 300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box', padding: '2rem' }}>
                <div className="score-circle" style={{ width: 'clamp(120px, 40vw, 160px)', height: 'clamp(120px, 40vw, 160px)', fontSize: 'clamp(3rem, 10vw, 5rem)' }}>{result.overall_score}</div>
                <h3 style={{ margin: 0, color: 'var(--gold-dark)', letterSpacing: '4px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>OVERALL SCORE</h3>
            </div>
            
            {result.coaching && (
                <div className="card" style={{ flex: '2 1 300px', maxWidth: '100%', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        <h3 style={{ margin: 0, color: 'var(--espresso)', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>TOP FIX</h3>
                    </div>
                    <p style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3, wordWrap: 'break-word', color: 'var(--espresso)', fontFamily: 'Syne, sans-serif' }}>"{result.coaching.top_fix}"</p>
                    <p className="mt-2" style={{ color: 'var(--text-body)', fontSize: 'clamp(1rem, 3.5vw, 1.1rem)', lineHeight: 1.6, wordWrap: 'break-word' }}><strong>Why:</strong> {result.coaching.why}</p>
                    <div className="mt-4" style={{ background: 'rgba(24,21,18,0.03)', padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--gold-dark)', wordWrap: 'break-word' }}>
                        <p style={{ margin: 0, color: 'var(--espresso)', fontSize: 'clamp(0.95rem, 3.5vw, 1.05rem)' }}><strong>Try this drill:</strong> {result.coaching.drill}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
