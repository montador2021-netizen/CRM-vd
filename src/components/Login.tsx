import React, { useState } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: name,
          email: email,
          role: 'vendedor'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error) {
      console.error("Erro na autenticação:", error);
      setError("Não foi possível acessar. Verifique o e-mail e a senha.");
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not, create record
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          role: 'vendedor'
        });
      }
      onLogin();
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setError("Não foi possível entrar com Google.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase italic">V&C Quantum CRM</h1>
      <form onSubmit={handleAuth} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
        {isRegistering && (
          <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
        )}
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
        <button type="submit" className="w-full p-4 bg-purple-600 text-white rounded-xl font-bold uppercase">
          {isRegistering ? 'Cadastrar' : 'Entrar'}
        </button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>
        <button type="button" onClick={handleGoogleSignIn} className="w-full p-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold uppercase flex items-center justify-center gap-2">
          Entrar com Google
        </button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs text-gray-500 underline">
          {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
        </button>
      </form>
    </div>
  );
};
