import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black uppercase tracking-widest text-gray-800 flex items-center gap-2">
            <Lock size={18} /> Acesso Admin
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite a senha"
          className="w-full p-4 rounded-xl border-2 border-gray-200 text-center text-lg font-bold outline-none focus:border-purple-500"
        />
        <button
          onClick={() => {
            onConfirm(password);
            setPassword('');
          }}
          className="w-full p-4 bg-purple-600 text-white rounded-xl font-black uppercase hover:bg-purple-700 transition-all"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};
