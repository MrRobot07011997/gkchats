import React, { useState } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

function App() {
  const [username, setUsername] = useState('');

  const handleLogin = (name: string) => {
    setUsername(name);
  };

  const handleLogout = () => {
    setUsername('');
  };

  return (
    <div>
      {!username ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ChatRoom username={username} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;