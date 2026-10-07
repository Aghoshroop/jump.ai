import React, { useState, useEffect, useRef } from 'react';

const LongJumpGame: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'power' | 'angle' | 'result'>('idle');
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const reqRef = useRef<number>();
  const valRef = useRef(0);
  const dirRef = useRef(1);

  const startPower = () => {
    setPhase('power');
    valRef.current = 0;
    dirRef.current = 1;
    
    const animate = () => {
      valRef.current += dirRef.current * 2;
      if (valRef.current >= 100) { valRef.current = 100; dirRef.current = -1; }
      if (valRef.current <= 0) { valRef.current = 0; dirRef.current = 1; }
      setPower(valRef.current);
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
  };

  const lockPowerAndStartAngle = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    setPhase('angle');
    valRef.current = 0;
    dirRef.current = 1;
    
    const animate = () => {
      valRef.current += dirRef.current * 1.5;
      if (valRef.current >= 90) { valRef.current = 90; dirRef.current = -1; }
      if (valRef.current <= 0) { valRef.current = 0; dirRef.current = 1; }
      setAngle(valRef.current);
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
  };

  const lockAngleAndJump = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    
    // Physics calculation
    const v = (power / 100) * 11; // up to 11 m/s velocity
    const theta = angle * (Math.PI / 180);
    const g = 9.8;
    
    const dist = (v * v * Math.sin(2 * theta)) / g;
    const finalDist = Math.max(0, dist);
    
    setDistance(Number(finalDist.toFixed(2)));
    if (finalDist > highScore) setHighScore(Number(finalDist.toFixed(2)));
    
    setPhase('result');
  };

  const handleClick = () => {
    if (phase === 'idle' || phase === 'result') startPower();
    else if (phase === 'power') lockPowerAndStartAngle();
    else if (phase === 'angle') lockAngleAndJump();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--espresso)', fontFamily: 'Syne, sans-serif' }}>Long Jump Pro</h2>
      <div style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#888', fontWeight: 'bold' }}>
        Record: {highScore}m
      </div>

      <div 
        onClick={handleClick}
        style={{ width: '100%', maxWidth: '400px', background: '#fff', padding: '2rem', borderRadius: '16px', border: '2px solid var(--espresso)', textAlign: 'center', cursor: 'pointer', boxShadow: '0 8px 0 var(--espresso)' }}
      >
        {phase === 'idle' && (
           <div>
             <div style={{ fontSize: '4rem', margin: '1rem 0' }}>🏃‍♂️</div>
             <h3 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>Tap anywhere to start</h3>
             <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>1. Tap to lock <b>Speed</b><br/>2. Tap to lock <b>Launch Angle</b><br/><i>Hint: 45° is optimal!</i></p>
           </div>
        )}
        
        {(phase === 'power' || phase === 'angle') && (
           <div style={{ margin: '2rem 0' }}>
             <h3 style={{ marginBottom: '1.5rem', color: phase === 'power' ? '#ff4444' : '#4CAF50', fontSize: '1.5rem' }}>
               {phase === 'power' ? 'SET SPEED!' : 'SET ANGLE!'}
             </h3>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ width: '60px', fontWeight: 'bold', textAlign: 'right' }}>Speed</span>
                <div style={{ flex: 1, height: '24px', background: '#eee', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ccc' }}>
                  <div style={{ width: `${phase === 'power' ? power : power}%`, height: '100%', background: phase === 'power' ? '#ff4444' : '#4CAF50' }} />
                </div>
                <span style={{ width: '45px', textAlign: 'left', fontWeight: 'bold' }}>{Math.round(power)}</span>
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '60px', fontWeight: 'bold', textAlign: 'right' }}>Angle</span>
                <div style={{ flex: 1, height: '24px', background: '#eee', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ccc' }}>
                  <div style={{ width: `${(angle / 90) * 100}%`, height: '100%', background: phase === 'angle' ? '#ff4444' : (phase === 'power' ? '#eee' : '#4CAF50') }} />
                </div>
                <span style={{ width: '45px', textAlign: 'left', fontWeight: 'bold' }}>{Math.round(angle)}°</span>
             </div>
           </div>
        )}

        {phase === 'result' && (
           <div style={{ margin: '1rem 0' }}>
             <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏅</div>
             <h3 style={{ color: 'var(--espresso)', fontSize: '3rem', margin: '0 0 1rem 0' }}>{distance}m</h3>
             <p style={{ color: '#666', margin: 0 }}>Speed: {Math.round(power)} | Angle: {Math.round(angle)}°</p>
             <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--sand-2)', borderRadius: '50px', fontWeight: 'bold', color: 'var(--espresso)' }}>Tap to jump again</div>
           </div>
        )}
      </div>
    </div>
  )
}

const HurdleDashGame: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [characterY, setCharacterY] = useState(0);
  const [obstacleX, setObstacleX] = useState(100);
  
  const velocity = useRef(0);
  const isJumping = useRef(false);
  const requestRef = useRef<number>();

  const startGame = (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setIsPlaying(true);
    setScore(0);
    setIsGameOver(false);
    setCharacterY(0);
    setObstacleX(100);
    velocity.current = 0;
    isJumping.current = false;
  };

  const jump = () => {
    if (!isJumping.current && !isGameOver) {
      velocity.current = 18; // higher jump
      isJumping.current = true;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    let lastTime = performance.now();
    
    const update = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.66, 2); 
      lastTime = time;

      setCharacterY((prev) => {
        let newY = prev + velocity.current * delta;
        velocity.current -= 0.9 * delta; // gravity
        if (newY <= 0) {
          newY = 0;
          isJumping.current = false;
          velocity.current = 0;
        }
        return newY;
      });

      const speedMultiplier = 1 + (score * 0.08);
      
      setObstacleX((prev) => {
        let newX = prev - (1.6 * speedMultiplier * delta);
        if (newX < -10) {
           newX = 100 + Math.random() * 20;
           setScore(s => s + 1);
        }
        return newX;
      });
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, isGameOver, score]);

  useEffect(() => {
    const charBottom = characterY;
    const obsLeft = obstacleX;
    const obsRight = obstacleX + 5;
    const obsTop = 45; 
    
    if (obsLeft < 15 && obsRight > 10 && charBottom < obsTop) {
      setIsGameOver(true);
    }
  }, [characterY, obstacleX]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
       <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--espresso)', fontFamily: 'Syne, sans-serif' }}>Hurdle Dash</h2>
       
       <div 
         onClick={isPlaying && !isGameOver ? jump : undefined}
         style={{ width: '100%', maxWidth: '600px', height: '350px', background: '#87CEEB', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '4px solid var(--espresso)', cursor: isPlaying && !isGameOver ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 0 var(--espresso)' }}
       >
         {!isPlaying && !isGameOver && (
           <div style={{ margin: 'auto', textAlign: 'center', background: 'rgba(255,255,255,0.9)', padding: '2rem', borderRadius: '16px', border: '2px solid var(--espresso)' }}>
             <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏃‍♀️</div>
             <h3 style={{ margin: '0 0 1rem 0' }}>Tap to jump over hurdles!</h3>
             <button onClick={startGame} style={{ background: 'var(--gold-dark)', color: '#fff', padding: '1rem 2rem', border: 'none', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>START RACE</button>
           </div>
         )}
         
         {(isPlaying || isGameOver) && (
           <>
             <div style={{ position: 'absolute', top: 20, right: 30, fontSize: '2rem', fontWeight: '900', color: '#fff', textShadow: '2px 2px 0 #000' }}>SCORE: {score}</div>
             
             {/* Track background */}
             <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', background: '#d35444', borderTop: '6px solid #fff' }}>
                <div style={{ width: '100%', height: '4px', background: '#fff', opacity: 0.6, marginTop: '25px' }}></div>
                <div style={{ width: '100%', height: '4px', background: '#fff', opacity: 0.6, marginTop: '25px' }}></div>
             </div>

             {/* Athlete */}
             <div style={{ position: 'absolute', bottom: `${100 + characterY}px`, left: '10%', width: '40px', height: '60px', background: 'var(--gold-dark)', borderRadius: '10px', border: '3px solid var(--espresso)' }}></div>

             {/* Hurdle */}
             <div style={{ position: 'absolute', bottom: '100px', left: `${obstacleX}%`, width: '12px', height: '45px', background: '#fff', border: '3px solid #333' }}>
                <div style={{ width: '40px', height: '12px', background: '#ff4444', border: '3px solid #333', marginLeft: '-17px' }}></div>
             </div>

             {isGameOver && (
               <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h2 style={{ fontSize: '3rem', margin: 0, color: '#ff4444', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' }}>Wipeout!</h2>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: '1rem 0 2rem 0' }}>Cleared: {score} hurdles</p>
                  <button onClick={startGame} style={{ background: 'var(--gold-dark)', color: '#fff', padding: '1rem 2rem', border: 'none', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>RACE AGAIN</button>
               </div>
             )}
           </>
         )}
       </div>
    </div>
  )
}

const MiniGame: React.FC = () => {
  const [activeGame, setActiveGame] = useState<'menu' | 'longjump' | 'hurdles' | null>(null);

  if (!activeGame) {
    return (
      <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%' }}>
        <button 
          onClick={() => setActiveGame('menu')}
          style={{ background: 'var(--gold-dark)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(145, 117, 64, 0.4)' }}
        >
          🎮 Play JUMP Arcade While Waiting
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'var(--espresso)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000' }}>
        {activeGame !== 'menu' ? (
          <button 
            onClick={() => setActiveGame('menu')}
            style={{ background: 'transparent', color: 'var(--gold-light)', border: '1px solid var(--gold-dark)', padding: '0.5rem 1rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Back to Menu
          </button>
        ) : (
          <span style={{ color: 'var(--gold-dark)', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>Analysis running in background...</span>
        )}
        
        <button 
          onClick={() => setActiveGame(null)}
          style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Close Arcade
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--sand-2)', overflow: 'auto' }}>
        {activeGame === 'menu' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '4rem', padding: '2rem', gap: '2rem' }}>
             <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--espresso)', fontSize: '2.5rem', letterSpacing: '2px', textAlign: 'center' }}>JUMP.AI ARCADE</h2>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', width: '100%', maxWidth: '700px' }}>
               <button onClick={() => setActiveGame('longjump')} style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '16px', border: '4px solid var(--espresso)', cursor: 'pointer', textAlign: 'center', boxShadow: '0 8px 0 var(--espresso)', transition: 'transform 0.1s' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📏</div>
                  <h3 style={{ margin: 0, color: 'var(--espresso)', fontSize: '1.5rem', fontFamily: 'Syne, sans-serif' }}>Long Jump Pro</h3>
                  <p style={{ color: '#666', marginTop: '0.5rem', fontWeight: 'bold' }}>Timing & Physics</p>
               </button>
               
               <button onClick={() => setActiveGame('hurdles')} style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '16px', border: '4px solid var(--espresso)', cursor: 'pointer', textAlign: 'center', boxShadow: '0 8px 0 var(--espresso)', transition: 'transform 0.1s' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏃‍♂️</div>
                  <h3 style={{ margin: 0, color: 'var(--espresso)', fontSize: '1.5rem', fontFamily: 'Syne, sans-serif' }}>Hurdle Dash</h3>
                  <p style={{ color: '#666', marginTop: '0.5rem', fontWeight: 'bold' }}>Reflexes & Speed</p>
               </button>
             </div>
          </div>
        )}
        
        {activeGame === 'longjump' && <LongJumpGame />}
        {activeGame === 'hurdles' && <HurdleDashGame />}
      </div>
    </div>
  );
};

export default MiniGame;
