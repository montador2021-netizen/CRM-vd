import React, { useState } from 'react';
import { User } from '../types';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AlertModal } from './AlertModal';

interface UserIdentificationProps {
  onIdentify: (user: User) => void;
}

export const UserIdentification: React.FC<UserIdentificationProps> = ({ onIdentify }) => {
  const [firstName, setFirstName] = useState('');
  const [store, setStore] = useState('Loja 1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userData: User = {
        id: user.uid,
        firstName: user.displayName || 'Usuário',
        lastName: '',
        store: store,
        password: '',
        role: (user.email === 'montador2021@gmail.com') ? 'admin' : 'vendedor'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      onIdentify(userData);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      setErrorMessage("Erro ao fazer login com Google. Tente novamente.");
    }
  };

  const handleIdentify = () => {
    if (!firstName.trim()) return;
    
    const user: User = {
      id: 'anon-' + Date.now(),
      firstName: firstName.trim(),
      lastName: '',
      store: store,
      password: '',
      role: (firstName.trim() === 'Valmir') ? 'admin' : 'vendedor'
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    onIdentify(user);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      {errorMessage && (
        <AlertModal message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase italic">V&C Quantum CRM</h1>
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
        <h2 className="text-xl font-bold text-center mb-4">Identifique-se</h2>
        
        <button 
          onClick={handleGoogleLogin} 
          className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl font-bold text-lg text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          Entrar com Google
        </button>

        <div className="text-center text-gray-400 font-bold text-sm uppercase">ou</div>

        <input 
          type="text" 
          placeholder="Nome (Modo Offline)" 
          value={firstName} 
          onChange={e => setFirstName(e.target.value)} 
          className="w-full p-4 rounded-xl border-2 border-gray-300 text-center text-lg font-bold text-gray-900" 
        />
        <select 
          value={store} 
          onChange={e => setStore(e.target.value)} 
          className="w-full p-4 rounded-xl border-2 border-gray-300 text-center text-lg font-bold text-gray-900 bg-white"
        >
          {Array.from({ length: 28 }, (_, i) => (
            <option key={i + 1} value={`Loja ${i + 1}`}>Loja {i + 1}</option>
          ))}
        </select>
        <button 
          onClick={handleIdentify} 
          className="w-full p-5 bg-purple-600 text-white rounded-xl font-black text-lg uppercase hover:bg-purple-700 transition-all"
        >
          Confirmar (Offline)
        </button>
      </div>
    </div>
  );
};
