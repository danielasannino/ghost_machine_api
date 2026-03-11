import React from 'react'
import GameRoom from './components/GameRoom'

function App() {
  // For now, we'll hardcode the ID from your successful 'join' (Player 3)
  // Later, we'll get this from a login/join form
  const roomId = 1 
  const currentPlayerId = 3 

  return (
    <div className="App">
      <h1>Ghost Machine 👻</h1>
      <GameRoom roomId={roomId} currentPlayerId={currentPlayerId} />
    </div>
  )
}

export default App
