import React, { useState, useEffect, useRef } from 'react';

const MiniGame: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [characterY, setCharacterY] = useState(0);
  const [obstacleX, setObstacleX] = useState(100);
  const velocity = useRef(0);
  const isJumping = useRef(false);
  const requestRef = useRef<number>();

  const startGame = () => {
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
      velocity.current = 16;
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
      const delta = Math.min((time - lastTime) / 16.66, 2); // Cap delta to prevent huge jumps on lag
      lastTime = time;

      // Physics
      setCharacterY((prev) => {
        let newY = prev + velocity.current * delta;
        velocity.current -= 0.8 * delta; // gravity
        
        if (newY <= 0) {
          newY = 0;
          isJumping.current = false;
          velocity.current = 0;
        }
        return newY;
      });

      // Obstacle speed scales slightly with score
      const speedMultiplier = 1 + (score * 0.05);
      
      setObstacleX((prev) => {
        let newX = prev - (1.5 * speedMultiplier * delta);
        if (newX < -10) {
           newX = 100 + Math.random() * 20;
           setScore(s => s + 1);
        }
        return newX;
      });

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isGameOver, score]);

  // Collision detection
  useEffect(() => {
    const charLeft = 10;
    const charRight = 10 + (30 / 4); // roughly converting px to % for collision approximation
    const charBottom = characterY;
    
    const obsLeft = obstacleX;
    const obsRight = obstacleX + (20 / 4);
    const obsTop = 40; // obstacle height
    
    if (
      obsLeft < 15 && // char right approximation in %
      obsRight > 10 && // char left approximation in %
      charBottom < obsTop
    ) {
      setIsGameOver(true);
    }
  }, [characterY, obstacleX]);

  if (!isPlaying) {
    return (
      <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%' }}>
        <button 
          onClick={startGame}
          style={{ background: 'var(--gold-dark)', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(145, 117, 64, 0.4)' }}
        >
          🎮 Play Mini-Game while you wait
        </button>
      </div>
    );
  }

  return (
    <div 
        onClick={jump}
        style={{ marginTop: '2rem', width: '100%', height: '180px', background: 'var(--sand-2)', borderRadius: '16px', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '4px solid var(--espresso)', boxSizing: 'border-box' }}
    >
      <div style={{ position: 'absolute', top: 15, right: 20, fontWeight: '900', fontFamily: 'Syne, sans-serif', color: 'var(--espresso)', fontSize: '1.4rem' }}>
        SCORE: {score}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px', background: 'var(--espresso)' }}></div>

      <div style={{ 
          position: 'absolute', 
          bottom: `${24 + characterY}px`, 
          left: '10%', 
          width: '32px', 
          height: '32px', 
          background: 'var(--gold-dark)',
          borderRadius: '6px',
          boxShadow: '0 0 10px rgba(145,117,64,0.5)'
      }}></div>

      <div style={{ 
          position: 'absolute', 
          bottom: '24px', 
          left: `${obstacleX}%`, 
          width: '24px', 
          height: '40px', 
          background: '#ff4444',
          borderRadius: '6px 6px 0 0'
      }}></div>

      {isGameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(24, 21, 18, 0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: '900', fontSize: '2rem', marginBottom: '1rem', fontFamily: 'Syne, sans-serif' }}>CRASHED!</div>
          <button 
            onClick={(e) => { e.stopPropagation(); startGame(); }}
            style={{ background: 'var(--gold-dark)', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniGame;
