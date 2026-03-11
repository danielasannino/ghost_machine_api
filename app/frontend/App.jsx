import React, { useState } from 'react';
import JoinForm from './components/JoinForm';
import GameRoom from './components/GameRoom';

function App() {
  const [gameData, setGameData] = useState(null); // { player: {}, room: {} }

  const handleJoin = (player, room) => {
    setGameData({ player, room });
  };

  return (
    <div className="App">
      {!gameData ? (
        <JoinForm onJoin={handleJoin} />
      ) : (
        <GameRoom 
          roomId={gameData.room.code} 
          currentPlayerId={gameData.player.id} 
        />
      )}
    </div>
  );
}

export default App;
