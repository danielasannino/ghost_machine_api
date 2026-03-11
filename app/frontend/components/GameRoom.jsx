import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createConsumer } from '@rails/actioncable';
import '../styles/game.css'; 

const GameRoom = ({ roomId, currentPlayerId }) => {
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [channel, setChannel] = useState(null);
  const chatEndRef = useRef(null);

  const consumer = useMemo(() => createConsumer(), []);

  // 1. SOCKET & INITIAL SYNC
  useEffect(() => {
    fetch(`/rooms/${roomId}`).then(res => res.json()).then(data => setPlayers(data.players || []));

    const sub = consumer.subscriptions.create({ channel: "GameChannel", room_id: roomId }, {
      received: (data) => {
        switch (data.type) {
          case "PLAYER_MOVED":
            setPlayers(prev => prev.map(p => p.id === data.player_id ? { ...p, x: data.x, y: data.y } : p));
            break;
          case "PLAYER_JOINED":
            setPlayers(prev => prev.some(p => p.id === data.player.id) ? prev : [...prev, data.player]);
            break;
          case "GAME_STARTED":
            setPlayers(data.players); // Full sync wipes ghosts
            break;
          case "PLAYER_INFECTED":
            setPlayers(prev => prev.map(p => p.id === data.player_id ? { ...p, role: 'virus' } : p));
            break;
          case "CHAT_MESSAGE":
            setMessages(prev => [...prev, data]);
            break;
        }
      }
    });
    setChannel(sub);
    return () => sub.unsubscribe();
  }, [roomId, consumer]);

  // 2. BOT CHASE LOGIC (AI)
  useEffect(() => {
    if (!channel || players.length < 2) return;

    // Only the first human player "drives" the bot to keep it synced
    const isLeader = players.filter(p => !p.is_bot)[0]?.id === currentPlayerId;
    if (!isLeader) return;

    const botLoop = setInterval(() => {
      const bot = players.find(p => p.is_bot);
      const target = players.find(p => !p.is_bot); // Chase the first human found

      if (!bot || !target) return;

      const dx = target.x - bot.x;
      const dy = target.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) return; // Stop if touching

      // Speed: Virus bots are 2x faster
      const speed = bot.role === 'virus' ? 0.6 : 0.3;
      const newX = bot.x + (dx / dist) * speed;
      const newY = bot.y + (dy / dist) * speed;

      channel.perform("move", { player_id: bot.id, x: newX, y: newY });
    }, 100);

    return () => clearInterval(botLoop);
  }, [players, channel, currentPlayerId]);

  // 3. COLLISION (INFECTION) CHECK
  useEffect(() => {
    const virus = players.find(p => p.role === 'virus');
    if (!virus || !channel) return;

    players.forEach(other => {
      if (other.id !== virus.id && other.role === 'engineer') {
        const dist = Math.sqrt(Math.pow(virus.x - other.x, 2) + Math.pow(virus.y - other.y, 2));
        if (dist < 4) channel.perform("infect_player", { player_id: other.id });
      }
    });
  }, [players, channel]);

  // 4. KEYBOARD CONTROLS
  useEffect(() => {
    const handleKey = (e) => {
      if (!channel || e.target.tagName === 'INPUT') return;
      const me = players.find(p => p.id === currentPlayerId);
      if (!me) return;

      let { x, y } = me;
      const step = 2.5;
      if (e.key.includes('Up')) y -= step;
      if (e.key.includes('Down')) y += step;
      if (e.key.includes('Left')) x -= step;
      if (e.key.includes('Right')) x += step;

      channel.perform("move", { 
        player_id: currentPlayerId, 
        x: Math.max(5, Math.min(95, x)), 
        y: Math.max(5, Math.min(95, y)) 
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [channel, players, currentPlayerId]);

  return (
    <div className="game-container">
      <div className="game-grid">
        {players.map(p => (
          <div 
            key={p.id} 
            className={`player-node ${p.role} ${p.id === currentPlayerId ? 'is-me' : ''} ${p.is_bot ? 'is-bot' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="player-label">
               {p.name.toUpperCase()} {p.is_bot && <span className="bot-tag">[BOT]</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="terminal-interface">
        <div className="message-feed">
          {messages.map((m, i) => <div key={i}><strong>[{m.name}]</strong> {m.message}</div>)}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          if(chatInput.trim()) channel.perform("send_chat", { name: players.find(p => p.id === currentPlayerId)?.name, message: chatInput }); 
          setChatInput(""); 
        }}>
          <input className="chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="SYSTEM_READY..." />
        </form>
      </div>
    </div>
  );
};

export default GameRoom;

