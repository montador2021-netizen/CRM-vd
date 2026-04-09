import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../src/firebase';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  store: string;
  password: string;
  role: 'vendedor' | 'admin';
}

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const user: User = {
        id: userCredential.user.uid,
        firstName: name.trim(),
        lastName: '',
        store: 'Geral',
        password: '',
        role: 'vendedor' // Default role for anonymous users
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
    } catch (error) {
      console.error("Erro ao entrar:", error);
      alert("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase italic">V&C Quantum CRM</h1>
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
        <input 
          type="text" 
          placeholder="Digite seu nome" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full p-5 rounded-xl border-2 border-gray-300 text-center text-xl font-bold text-gray-900" 
        />
        <button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full p-5 bg-purple-600 text-white rounded-xl font-black text-lg uppercase hover:bg-purple-700 transition-all"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
};
