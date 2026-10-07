import React, { useState } from 'react';

const GAMES = [
  { id: '2048', name: '2048', url: 'https://play2048.co/', icon: '🧩' },
  { id: 'tictactoe', name: 'Tic Tac Toe', url: 'https://playtictactoe.org/', icon: '❌' },
  { id: 'flappy', name: 'Flappy Bird', url: 'https://flappybird.io/', icon: '🐦' },
  { id: 'hextris', name: 'Hextris', url: 'https://hextris.io/', icon: '⬡' }
];

const MiniGame: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeGameUrl, setActiveGameUrl] = useState<string | null>(null);

  return (
    <>
      <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--gold-dark)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(145, 117, 64, 0.4)' }}
        >
          🎮 Play a Game While Waiting
        </button>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'var(--espresso)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000' }}>
            {activeGameUrl ? (
              <button 
                onClick={() => setActiveGameUrl(null)}
                style={{ background: 'transparent', color: 'var(--gold-light)', border: '1px solid var(--gold-dark)', padding: '0.5rem 1rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ← Back to Menu
              </button>
            ) : (
              <span style={{ color: 'var(--gold-dark)', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>Analysis running in background...</span>
            )}
            
            <button 
              onClick={() => { setShowModal(false); setActiveGameUrl(null); }}
              style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          
          {activeGameUrl ? (
            <iframe 
              src={activeGameUrl} 
              style={{ width: '100%', flex: 1, border: 'none', background: '#fff' }}
              title="Mini Game"
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '4rem', padding: '2rem', gap: '1rem', background: 'var(--sand-2)', overflowY: 'auto' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--espresso)', marginBottom: '1rem', fontSize: '2rem', letterSpacing: '2px' }}>ARCADE LOBBY</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', width: '100%', maxWidth: '600px' }}>
                {GAMES.map(game => (
                  <button 
                    key={game.id}
                    onClick={() => setActiveGameUrl(game.url)}
                    style={{ 
                      background: '#fff', border: '2px solid var(--gold-dark)', borderRadius: '12px', padding: '1.5rem', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s', minHeight: '140px', justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '3rem' }}>{game.icon}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--espresso)' }}>{game.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MiniGame;
