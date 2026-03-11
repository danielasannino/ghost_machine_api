// app/frontend/components/GameRoom.jsx
import React, { useEffect, useState } from 'react';
import { createConsumer } from '@rails/actioncable';

const GameRoom = ({ roomId, currentPlayerId }) => {
  const [players, setPlayers] = useState([]);
  const [channel, setChannel] = useState(null);

  // 1. Setup ActionCable Subscription
  useEffect(() => {
    const consumer = createConsumer();
    
    const subscription = consumer.subscriptions.create(
      { channel: "GameChannel", room_id: roomId },
      {
        received: (data) => {
          console.log("Received from Rails:", data);
          if (data.type === "PLAYER_MOVED") {
            setPlayers((prev) =>
              prev.map((p) => (p.id === data.player_id ? { ...p, x: data.x, y: data.y } : p))
            );
          } else if (data.type === "PLAYER_JOINED") {
            setPlayers((prev) => {
              // Prevent duplicate players if already in list
              if (prev.find(p => p.id === data.player.id)) return prev;
              return [...prev, data.player];
            });
          }
        }
      }
    );

    setChannel(subscription);

    return () => {
      console.log("Unsubscribing...");
      subscription.unsubscribe();
    };
  }, [roomId]);

  // 2. Handle Keyboard Movement (Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!channel) return;

      const me = players.find(p => p.id === currentPlayerId);
      if (!me) return;

      let newX = me.x;
      let newY = me.y;
      const step = 2; // Distance per keypress

      if (e.key === 'ArrowUp')    newY -= step;
      if (e.key === 'ArrowDown')  newY += step;
      if (e.key === 'ArrowLeft')  newX -= step;
      if (e.key === 'ArrowRight') newX += step;

      // Keep inside 100x100 bounds
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      // Only send if coordinates actually changed
      if (newX !== me.x || newY !== me.y) {
        channel.perform("move", { player_id: currentPlayerId, x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [channel, players, currentPlayerId]);

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              ...styles.player,
              left: `${player.x}%`,
              top: `${player.y}%`,
              backgroundColor: player.role === 'virus' ? '#ff4d4d' : '#4d94ff',
              border: player.id === currentPlayerId ? '2px solid gold' : '1px solid white'
            }}
          >
            <div style={styles.label}>{player.name}</div>
          </div>
        ))}
      </div>
      <div style={styles.legend}>
        <p>Use <b>Arrow Keys</b> to move. You are the gold-outlined dot.</p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' },
  grid: {
    position: 'relative',
    width: '600px',
    height: '400px',
    backgroundColor: '#1a1a1a',
    border: '4px solid #333',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  player: {
    position: 'absolute',
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    transition: 'all 0.1s linear', // Smooths out the jumps
    transform: 'translate(-50%, -50%)' // Centers the dot on the coordinate
  },
  label: {
    position: 'absolute',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },
  legend: { marginTop: '10px', color: '#666', fontFamily: 'sans-serif' }
};

export default GameRoom;
