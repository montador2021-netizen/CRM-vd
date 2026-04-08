import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@crm.vcquantum.com`;

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}` });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: `${firstName} ${lastName}`,
          email: email,
          role: 'vendedor'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error) {
      console.error("Erro na autenticação:", error);
      setError("Não foi possível acessar. Verifique seu nome e senha.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase italic">V&C Quantum CRM</h1>
      <form onSubmit={handleAuth} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
        <input type="text" placeholder="Primeiro Nome" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
        <input type="text" placeholder="Segundo Nome" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
        <button type="submit" className="w-full p-4 bg-purple-600 text-white rounded-xl font-bold uppercase">
          {isRegistering ? 'Cadastrar' : 'Entrar'}
        </button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs text-gray-500 underline">
          {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
        </button>
      </form>
    </div>
  );
};
