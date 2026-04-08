import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

interface LoginProps {
  onLogin: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  const handlePinSubmit = async () => {
    if (!selectedUser) return;
    setError(null);
    try {
      // Sign in using the user's email and the PIN as the password
      await signInWithEmailAndPassword(auth, selectedUser.email, pin);
      onLogin();
    } catch (error) {
      setError("PIN incorreto.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const email = `${newName.toLowerCase().replace(/\s/g, '.')}@crm.local`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, newPin);
      await updateProfile(userCredential.user, { displayName: newName });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newName,
        email: email,
        pin: newPin,
        role: 'vendedor'
      });
      setIsRegistering(false);
      alert('Vendedor cadastrado com sucesso!');
    } catch (error) {
      setError("Erro ao cadastrar vendedor.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase italic">V&C Quantum CRM</h1>
      
      {!isRegistering ? (
        !selectedUser ? (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-center mb-4">Selecione seu nome</h2>
            {users.map(user => (
              <button key={user.id} onClick={() => setSelectedUser(user)} className="w-full p-4 bg-purple-50 text-purple-700 rounded-xl font-bold hover:bg-purple-100">
                {user.name}
              </button>
            ))}
            <button onClick={() => setIsRegistering(true)} className="w-full text-xs text-gray-500 underline mt-4">Cadastrar novo vendedor</button>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-center mb-4">Olá, {selectedUser.name}</h2>
            <input type="password" placeholder="Digite seu PIN" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} className="w-full p-4 rounded-xl border border-gray-200 text-center text-2xl tracking-widest" />
            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
            <button onClick={handlePinSubmit} className="w-full p-4 bg-purple-600 text-white rounded-xl font-bold uppercase">Entrar</button>
            <button onClick={() => setSelectedUser(null)} className="w-full text-xs text-gray-500 underline">Voltar</button>
          </div>
        )
      ) : (
        <form onSubmit={handleRegister} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-center mb-4">Cadastrar Vendedor</h2>
          <input type="text" placeholder="Nome Completo" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" required />
          <input type="password" placeholder="Definir PIN (4 dígitos)" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={4} className="w-full p-4 rounded-xl border border-gray-200" required />
          <button type="submit" className="w-full p-4 bg-purple-600 text-white rounded-xl font-bold uppercase">Cadastrar</button>
          <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-xs text-gray-500 underline">Voltar</button>
        </form>
      )}
    </div>
  );
};
