import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
  isAdmin: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  store: string;
  password: string;
  role: 'vendedor' | 'admin';
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        setError("Erro ao carregar lista de vendedores.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLoginSubmit = async () => {
    if (!selectedUser) return;
    setError(null);
    if (password === selectedUser.password) {
      localStorage.setItem('currentUser', JSON.stringify(selectedUser));
      onLogin(selectedUser);
    } else {
      setError("Senha incorreta.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        firstName: newFirstName,
        lastName: newLastName,
        store: newStore,
        password: newPassword,
        role: 'vendedor'
      });
      setIsRegistering(false);
      alert('Vendedor cadastrado com sucesso!');
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      setError(`Erro ao cadastrar: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase italic">V&C Quantum CRM</h1>
      
      {loading ? (
        <p className="text-gray-500">Carregando vendedores...</p>
      ) : !isRegistering ? (
        !selectedUser ? (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-center mb-4">Selecione seu nome</h2>
            {users.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum vendedor cadastrado.</p>
            ) : (
              users.map(user => (
                <button key={user.id} onClick={() => setSelectedUser(user)} className="w-full p-5 bg-purple-50 text-purple-900 rounded-xl font-black text-lg hover:bg-purple-100 border border-purple-200">
                  {user.firstName} {user.lastName}
                </button>
              ))
            )}
            <button onClick={() => setIsRegistering(true)} className="w-full text-sm text-gray-600 underline mt-4 font-bold">Cadastrar novo vendedor</button>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-2xl font-black text-center mb-4 text-gray-900">Olá, {selectedUser.firstName}</h2>
            <input type="password" placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 rounded-xl border-2 border-gray-300 text-center text-2xl font-bold text-gray-900" />
            {error && <p className="text-red-600 text-md text-center font-black">{error}</p>}
            <button onClick={handleLoginSubmit} className="w-full p-5 bg-purple-600 text-white rounded-xl font-black text-lg uppercase">Entrar</button>
            <button onClick={() => setSelectedUser(null)} className="w-full text-sm text-gray-500 underline font-bold">Voltar</button>
          </div>
        )
      ) : (
        <form onSubmit={handleRegister} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-2xl font-black text-center mb-4 text-gray-900">Cadastrar Vendedor</h2>
          <input type="text" placeholder="Nome" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="w-full p-5 rounded-xl border-2 border-gray-300 text-lg font-bold text-gray-900" required />
          <input type="text" placeholder="Sobrenome" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="w-full p-5 rounded-xl border-2 border-gray-300 text-lg font-bold text-gray-900" required />
          <input type="text" placeholder="Loja" value={newStore} onChange={e => setNewStore(e.target.value)} className="w-full p-5 rounded-xl border-2 border-gray-300 text-lg font-bold text-gray-900" required />
          <input type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-5 rounded-xl border-2 border-gray-300 text-lg font-bold text-gray-900" required />
          <button type="submit" className="w-full p-5 bg-purple-600 text-white rounded-xl font-black text-lg uppercase">Cadastrar</button>
          <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-sm text-gray-500 underline font-bold">Voltar</button>
        </form>
      )}
    </div>
  );
};
