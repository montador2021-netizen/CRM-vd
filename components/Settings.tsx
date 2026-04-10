import React, { useState } from 'react';
import { Targets } from '../tipos';
import { Save, RotateCcw, Target, ShieldCheck, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  targets: Targets;
  onSave: (newTargets: Targets) => void;
  onClose: () => void;
  showInstallBtn?: boolean;
  onInstall?: () => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ targets, onSave, onClose, showInstallBtn, onInstall, onLogout }) => {
  const [tempTargets, setTempTargets] = useState<Targets>(targets);

  const handleLevelChange = (level: 1 | 2 | 3, field: 'threshold' | 'rate', value: number) => {
    setTempTargets({
      ...tempTargets,
      levels: {
        ...tempTargets.levels,
        [level]: {
          ...tempTargets.levels[level],
          [field]: value
        }
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Configurações</h2>
          <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Metas e Parâmetros</span>
        </div>
        <button onClick={onClose} className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase border border-gray-200 hover:bg-gray-200 transition-all">Voltar</button>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6 shadow-sm">
          <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} /> Metas Mensais
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-2">Meta de Produtos (R$)</label>
              <input 
                type="number" 
                value={tempTargets.product}
                onChange={(e) => setTempTargets({ ...tempTargets, product: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 font-bold focus:border-purple-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-2">Meta de Assistência (R$)</label>
              <input 
                type="number" 
                value={tempTargets.assistance}
                onChange={(e) => setTempTargets({ ...tempTargets, assistance: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 font-bold focus:border-purple-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase block mb-2">Meta de Impermeabilização (R$)</label>
              <input 
                type="number" 
                value={tempTargets.waterproofing}
                onChange={(e) => setTempTargets({ ...tempTargets, waterproofing: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 font-bold focus:border-purple-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6 shadow-sm">
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} /> Níveis de Acelerador
          </h3>
          
          {[1, 2, 3].map((lvl) => (
            <div key={lvl} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <span className="text-[9px] font-black text-gray-700 uppercase">Nível {lvl}</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Gatilho (%)</label>
                  <input 
                    type="number" 
                    value={tempTargets.levels[lvl as 1|2|3].threshold}
                    onChange={(e) => handleLevelChange(lvl as 1|2|3, 'threshold', Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Bônus (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={tempTargets.levels[lvl as 1|2|3].rate}
                    onChange={(e) => handleLevelChange(lvl as 1|2|3, 'rate', Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {showInstallBtn && (
          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 space-y-4 shadow-sm animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <Download className="text-purple-600" size={18} />
              <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Instalar Aplicativo</h3>
            </div>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              Instale o V&C Quantum CRM no seu dispositivo para acesso rápido e offline, como um aplicativo nativo.
            </p>
            <button 
              onClick={onInstall}
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
            >
              Instalar Agora
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={() => setTempTargets(targets)}
            className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-50"
          >
            <RotateCcw size={14} /> Resetar
          </button>
          <button 
            onClick={() => onSave(tempTargets)}
            className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
          >
            <Save size={14} /> Salvar Alterações
          </button>
        </div>

        <button 
          onClick={onLogout}
          className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-100"
        >
          Sair da Loja
        </button>
      </div>
    </motion.div>
  );
};

export default Settings;
