import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createConsumer } from '@rails/actioncable';
import '../styles/game.css'; 

const GameRoom = ({ roomId, currentPlayerId }) => {
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [channel, setChannel] = useState(null);
  const chatEndRef = useRef(null);

  // 1. STABLE CONSUMER (Prevents multiple socket connections causing "Ghost" players)
  const consumer = useMemo(() => createConsumer(), []);

  useEffect(() => {
    // Initial fetch to sync with DB
    fetch(`/rooms/${roomId}`)
      .then(res => res.json())
      .then(data => {
        // Only set players if we get a valid array, otherwise keep empty
        setPlayers(data.players || []);
      });

    const sub = consumer.subscriptions.create(
      { channel: "GameChannel", room_id: roomId }, 
      {
        received: (data) => {
          switch (data.type) {
            case "PLAYER_MOVED":
              setPlayers(prev => prev.map(p => 
                p.id === data.player_id ? { ...p, x: data.x, y: data.y } : p
              ));
              break;

            case "PLAYER_JOINED":
                setPlayers(prev => {
                    // If the ID already exists in our list, do nothing.
                    if (prev.some(p => p.id === data.player.id)) return prev;
                    return [...prev, data.player];
                });
                break;

            case "GAME_STARTED":
              // FIXED: When game starts, overwrite state with the FRESH list from DB
              // This wipes out any UI-only "ghost" players
              setPlayers(data.players);
              break;

            case "PLAYER_INFECTED":
              setPlayers(prev => prev.map(p => 
                p.id === data.virus_id ? { ...p, role: 'virus' } : p
              ));
              break;

            case "CHAT_MESSAGE":
              setMessages(prev => [...prev, data]);
              break;
            
            default:
              break;
          }
        }
      }
    );

    setChannel(sub);

    // Cleanup: Unsubscribe when leaving the room
    return () => {
      sub.unsubscribe();
    };
  }, [roomId, consumer]);

  // 2. COLLISION CHECK (Optimized to watch player state changes)
  useEffect(() => {
    const me = players.find(p => p.id === currentPlayerId);
    if (!me || me.role !== 'virus' || !channel) return;

    players.forEach(other => {
      if (other.id !== me.id && other.role === 'engineer') {
        const dist = Math.sqrt(Math.pow(me.x - other.x, 2) + Math.pow(me.y - other.y, 2));
        // Distance threshold for infection
        if (dist < 5.0) {
          channel.perform("infect_player", { player_id: other.id });
        }
      }
    });
  }, [players, currentPlayerId, channel]);

  // 3. KEYBOARD CONTROLS
  useEffect(() => {
    const handleKey = (e) => {
      if (!channel || e.target.tagName === 'INPUT') return;
      
      setPlayers(prev => {
        const me = prev.find(p => p.id === currentPlayerId);
        if (!me) return prev;

        let { x, y } = me;
        const step = 2.5;

        if (e.key.includes('Up')) y -= step;
        if (e.key.includes('Down')) y += step;
        if (e.key.includes('Left')) x -= step;
        if (e.key.includes('Right')) x += step;

        const newX = Math.max(5, Math.min(95, x));
        const newY = Math.max(5, Math.min(95, y));

        // Update server
        channel.perform("move", { 
          player_id: currentPlayerId, 
          x: newX, 
          y: newY 
        });

        // Optimistic UI update for smoothness
        return prev.map(p => p.id === currentPlayerId ? { ...p, x: newX, y: newY } : p);
      });
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [channel, currentPlayerId]);

  // 4. AUTO-SCROLL CHAT
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="game-container">
      <div className="game-grid">
        {players.map(p => (
          <div 
            key={p.id} 
            className={`player-node ${p.role} ${p.id === currentPlayerId ? 'is-me' : ''} ${p.is_bot ? 'is-bot' : ''}`}
            style={{ 
              left: `${p.x}%`, 
              top: `${p.y}%`,
              transition: 'all 0.1s linear' // Smoother movement
            }}
          >
            <div className="player-label">
              {p.name.toUpperCase()} {p.is_bot && <span className="bot-tag">[BOT]</span>}
            </div>
            {/* Visual indicator for Virus */}
            {p.role === 'virus' && <div className="virus-aura"></div>}
          </div>
        ))}
      </div>

      <div className="terminal-interface">
        <div className="message-feed">
          {messages.map((m, i) => (
            <div key={i} className="chat-line">
              <span className="timestamp">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
              <strong> {m.name}:</strong> {m.message}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        <form className="chat-form" onSubmit={(e) => { 
          e.preventDefault(); 
          if(chatInput.trim()) {
            const me = players.find(p => p.id === currentPlayerId);
            channel.perform("send_chat", { name: me?.name || "Unknown", message: chatInput }); 
          }
          setChatInput(""); 
        }}>
          <input 
            className="chat-input" 
            value={chatInput} 
            onChange={e => setChatInput(e.target.value)} 
            placeholder="TYPE_COMMAND_AND_ENTER..." 
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};

export default GameRoom;
