import React, { useRef, useEffect, useState } from 'react';
import { generatePhaseSpecificCoaching } from '../lib/jumpLogic';

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
  
  const [activePhaseDetail, setActivePhaseDetail] = useState<{name: string, data: any, analysis: any} | null>(null);

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
        
        {/* NEW HANG TIME PHYSICS ENGINE */}
        {result.metrics?.physics && (
            <div style={{ background: '#111', borderRadius: '24px', padding: '3rem 2rem', marginBottom: '4rem', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                
                <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.2rem', letterSpacing: '4px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    PHYSICS ENGINE
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <p style={{ color: '#888', margin: '0 0 0.5rem 0', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Air Time</p>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, fontFamily: 'Syne, sans-serif' }}>{result.metrics.physics.hangTime} <span style={{ fontSize: '1.5rem', color: '#666' }}>s</span></p>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <p style={{ color: '#888', margin: '0 0 0.5rem 0', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Max Height</p>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, fontFamily: 'Syne, sans-serif' }}>{result.metrics.physics.maxHeightInches} <span style={{ fontSize: '1.5rem', color: '#666' }}>in</span></p>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <p style={{ color: '#888', margin: '0 0 0.5rem 0', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Est. Distance</p>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, fontFamily: 'Syne, sans-serif', color: '#10b981' }}>{result.metrics.physics.estDistanceFeet} <span style={{ fontSize: '1.5rem', color: '#10b981' }}>ft</span></p>
                    </div>
                </div>
                
                <p style={{ marginTop: '2rem', color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic', maxWidth: '600px', lineHeight: 1.6 }}>
                    Calculated dynamically by isolating your takeoff and landing frames (∆t = {result.metrics.physics.hangTime}s), then driving a standard parabolic trajectory engine (H = g·t² / 8) to approximate vertical lift and horizontal carry.
                </p>
            </div>
        )}

        <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--gold-dark)', fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>PHASE BREAKDOWN</h3>
        <div className="grid" style={{ marginBottom: '4rem' }}>
            {Object.entries(result.phases || {}).map(([phaseName, phaseData]: [string, any]) => (
                <div key={phaseName} className="phase-card" style={{ padding: '0', overflow: 'hidden' }}>
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
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button className="secondary-btn" style={{ flex: 1, padding: '0.6rem' }}
                                onClick={() => {
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = phaseData.timestamp;
                                        videoRef.current.pause();
                                        videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }}
                            >
                                🎥 View Frame
                            </button>
                            <button 
                                style={{ flex: 1, background: 'var(--gold-dark)', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
                                onClick={() => {
                                    const analysis = generatePhaseSpecificCoaching(phaseName, result.metrics?.[phaseName]);
                                    setActivePhaseDetail({ name: phaseName, data: phaseData, analysis });
                                }}
                            >
                                🔬 Deep Dive
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex" style={{ gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem', width: '100%' }}>
            <div className="text-center" style={{ flex: '1 1 300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box', padding: '2rem' }}>
                <div className="score-circle" style={{ width: 'clamp(120px, 40vw, 160px)', height: 'clamp(120px, 40vw, 160px)', fontSize: 'clamp(3rem, 10vw, 5rem)' }}>{result.overall_score}</div>
                <h3 style={{ margin: 0, color: 'var(--gold-dark)', letterSpacing: '4px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>OVERALL SCORE</h3>
            </div>
            
            {result.coaching && (
                <div style={{ flex: '2 1 300px', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Strengths Section */}
                    {result.coaching.bestTrait && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <h3 style={{ margin: 0, color: 'var(--espresso)', fontSize: 'clamp(1rem, 3.5vw, 1.2rem)' }}>WHAT YOU DID BEST</h3>
                            </div>
                            <p style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, marginBottom: '0.8rem', lineHeight: 1.3, wordWrap: 'break-word', color: 'var(--espresso)', fontFamily: 'Syne, sans-serif' }}>"{result.coaching.bestTrait.title}"</p>
                            <p style={{ color: 'var(--text-body)', fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', lineHeight: 1.6, wordWrap: 'break-word' }}><strong>Why it matters:</strong> {result.coaching.bestTrait.why}</p>
                        </div>
                    )}

                    {/* Weaknesses Section */}
                    {result.coaching.worstIssue && (
                        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--sand-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <h3 style={{ margin: 0, color: 'var(--espresso)', fontSize: 'clamp(1rem, 3.5vw, 1.2rem)' }}>CRITICAL FIX</h3>
                            </div>
                            <p style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, marginBottom: '0.8rem', lineHeight: 1.3, wordWrap: 'break-word', color: 'var(--espresso)', fontFamily: 'Syne, sans-serif' }}>"{result.coaching.worstIssue.top_fix}"</p>
                            <p style={{ color: 'var(--text-body)', fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', lineHeight: 1.6, wordWrap: 'break-word' }}><strong>The flaw:</strong> {result.coaching.worstIssue.why}</p>
                            {result.coaching.worstIssue.drill && (
                                <div className="mt-3" style={{ background: 'rgba(24,21,18,0.03)', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid var(--gold-dark)', wordWrap: 'break-word' }}>
                                    <p style={{ margin: 0, color: 'var(--espresso)', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}><strong>Try this drill:</strong> {result.coaching.worstIssue.drill}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                </div>
            )}
        </div>
      </div>

      {activePhaseDetail && activePhaseDetail.analysis && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setActivePhaseDetail(null)}>
           <div style={{ background: 'var(--sand-2)', width: '100%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
               {activePhaseDetail.data.image_url && (
                   <div style={{ width: '100%', height: '200px', backgroundImage: `url(${activePhaseDetail.data.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                       <button onClick={() => setActivePhaseDetail(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#000', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                   </div>
               )}
               <div style={{ padding: '2rem', overflowY: 'auto' }}>
                   <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--espresso)', textTransform: 'uppercase', marginBottom: '2rem', fontSize: '2rem' }}>{activePhaseDetail.name} <span style={{ color: 'var(--gold-dark)' }}>Analysis</span></h2>
                   
                   <div style={{ marginBottom: '2rem' }}>
                       <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}><span>✓</span> What you're doing right</h3>
                       <p style={{ color: 'var(--text-body)', lineHeight: 1.6, paddingLeft: '1.5rem', borderLeft: '2px solid #10b981' }}>{activePhaseDetail.analysis.good}</p>
                   </div>
                   
                   <div style={{ marginBottom: '2rem' }}>
                       <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}><span>⚠</span> Where to improve</h3>
                       <p style={{ color: 'var(--text-body)', lineHeight: 1.6, paddingLeft: '1.5rem', borderLeft: '2px solid #f59e0b' }}>{activePhaseDetail.analysis.improvement}</p>
                   </div>

                   <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--gold-dark)' }}>
                       <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--espresso)', marginBottom: '0.5rem' }}><span>🏋️</span> Recommended Drill</h3>
                       <p style={{ color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>{activePhaseDetail.analysis.drill}</p>
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
