import React, { useState } from 'react';

const JoinForm = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('LOBBY');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/players/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, room_code: roomCode })
    });

    if (response.ok) {
      const data = await response.json();
      // Pass the new player and room back to the parent App
      onJoin(data.player, data.room);
    } else {
      alert("Failed to join game!");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Ghost Machine</h2>
        <input 
          placeholder="Your Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          style={styles.input}
        />
        <input 
          placeholder="Room Code" 
          value={roomCode} 
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
          required 
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Enter Lobby</button>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '100px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' },
  input: { padding: '10px', fontSize: '16px' },
  button: { padding: '10px', background: '#4d94ff', color: 'white', border: 'none', cursor: 'pointer' }
};

export default JoinForm;
