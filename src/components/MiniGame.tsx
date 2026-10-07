import React, { useState } from 'react';

const MiniGame: React.FC = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <>
      <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%' }}>
        <button 
          onClick={() => setShowGame(true)}
          style={{ background: 'var(--gold-dark)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(145, 117, 64, 0.4)' }}
        >
          🎮 Play a Game While Waiting
        </button>
      </div>

      {showGame && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'var(--espresso)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000' }}>
            <span style={{ color: 'var(--gold-dark)', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>Analysis running in background...</span>
            <button 
              onClick={() => setShowGame(false)}
              style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Close Game
            </button>
          </div>
          <iframe 
            src="https://play2048.co/" 
            style={{ width: '100%', flex: 1, border: 'none', background: '#fff' }}
            title="Mini Game"
          />
        </div>
      )}
    </>
  );
};

export default MiniGame;
