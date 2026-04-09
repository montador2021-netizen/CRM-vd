
import React, { useState, useEffect, useMemo } from 'react';
import { Login, User } from './src/components/Login';
import Sidebar from './components/Sidebar';
import SaleForm from './components/SaleForm';
import Settings from './components/Settings';
import Customers from './components/Customers';
import InstallPrompt from './components/InstallPrompt';
import { NavItem, Sale, Targets, WeeklyPerformance, DashboardStats, Customer } from './tipos';
import { PIPELINE_STAGES, MOCK_OPPORTUNITIES } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from './src/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, 
  Wrench, 
  Droplets, 
  Layers, 
  Layout, 
  Star, 
  ShieldCheck, 
  Zap, 
  Target,
  CloudLightning,
  Wifi,
  WifiOff,
  BarChart
} from 'lucide-react';

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const STORAGE_KEY = 'vc_quantum_data_v2';
const TARGETS_KEY = 'vc_quantum_targets_v1';
const CUSTOMERS_KEY = 'vc_quantum_customers_v1';

const DEFAULT_TARGETS: Targets = {
  product: 50000,
  assistance: 3000,
  waterproofing: 2000,
  levels: {
    1: { threshold: 100, rate: 0.6 },
    2: { threshold: 120, rate: 0.8 },
    3: { threshold: 140, rate: 1.1 }
  }
};

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.Resumos);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [savedSales, setSavedSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [reportPeriod, setReportPeriod] = useState<number>(30); // Dias
  const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.firstName === 'Valmir' && user?.lastName === 'Melo';
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Se o usuário estiver autenticado, restauramos o estado do usuário
        // Como agora é anônimo, podemos manter o nome se ele estiver no localStorage
        // ou apenas definir um usuário padrão.
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Fallback para usuário anônimo se não houver nada no localStorage
          setUser({
            id: firebaseUser.uid,
            firstName: 'Visitante',
            lastName: '',
            store: 'Geral',
            password: '',
            role: 'vendedor'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // Monitorar conexão e PWA
  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
    
    // Carregar dados do Firestore
    const unsubscribeSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
      setSavedSales(salesData);
    });

    const unsubscribeTargets = onSnapshot(doc(db, 'settings', 'targets'), (doc) => {
      if (doc.exists()) {
        setTargets(doc.data() as Targets);
      }
    });

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
      setCustomers(customersData);
    });

    return () => {
      unsubscribeSales();
      unsubscribeTargets();
      unsubscribeCustomers();
    };
  }, []);

  const filteredSales = useMemo(() => {
    if (isAdmin) return savedSales;
    return savedSales.filter(sale => sale.vendedorId === user?.id);
  }, [savedSales, isAdmin, user]);

  const saveTargets = async (newTargets: Targets) => {
    await setDoc(doc(db, 'settings', 'targets'), newTargets);
    setTargets(newTargets);
    setActiveNav(NavItem.Resumos);
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const saveSale = async (newSaleData: any) => {
    const saleObj: Sale = {
      numeroPedido: newSaleData.pedido,
      vendedorId: user?.id || 'unknown',
      clienteId: newSaleData.clienteId,
      valorProduto: newSaleData.produto,
      valorAssistencia: newSaleData.assistencia,
      valorImpermeabilizacao: newSaleData.impermeabilizacao,
      total: newSaleData.total,
      bonusTotal: newSaleData.bonusTotal,
      comissaoProduto: newSaleData.comissaoProduto,
      servicosExtras: newSaleData.servicosExtras,
      data: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now()
    };

    await addDoc(collection(db, 'sales'), saleObj);

    // Atualizar estatísticas do cliente se vinculado
    if (newSaleData.clienteId) {
      const customerRef = doc(db, 'customers', newSaleData.clienteId);
      const customer = customers.find(c => c.id === newSaleData.clienteId);
      if (customer) {
        await updateDoc(customerRef, {
          totalComprado: (customer.totalComprado || 0) + newSaleData.total,
          pedidosCount: (customer.pedidosCount || 0) + 1
        });
      }
    }
    
    setActiveNav(NavItem.ResumoPedido);
  };

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const stats = useMemo<DashboardStats>(() => {
    const pTotal = savedSales.reduce((acc, s) => acc + s.valorProduto, 0);
    const aTotal = savedSales.reduce((acc, s) => acc + s.valorAssistencia, 0);
    const iTotal = savedSales.reduce((acc, s) => acc + s.valorImpermeabilizacao, 0);
    const pPerc = targets.product > 0 ? (pTotal / targets.product) : 0;
    const aPerc = targets.assistance > 0 ? (aTotal / targets.assistance) : 0;
    const iPerc = targets.waterproofing > 0 ? (iTotal / targets.waterproofing) : 0;

    let level = 0;
    [3, 2, 1].forEach(lvlNum => {
      if (level > 0) return;
      const lNum = lvlNum as 1 | 2 | 3;
      const thresh = targets.levels[lNum].threshold / 100;
      if (pPerc >= thresh && aPerc >= thresh && iPerc >= thresh) level = lNum;
    });

    const serviceCounts = { 'Montagem': 0, 'Lavagem': 0, 'Almofada': 0, 'Pés G-Roupa': 0, 'Impermeab.': 0 };
    savedSales.forEach(s => {
      if (s.servicosExtras && Array.isArray(s.servicosExtras)) {
        s.servicosExtras.forEach(ex => { 
          if (Object.prototype.hasOwnProperty.call(serviceCounts, ex)) {
            (serviceCounts as any)[ex]++; 
          }
        });
      }
    });

    const totalExtras = Object.keys(serviceCounts).reduce((acc, k) => acc + ((serviceCounts as any)[k] * (k === 'Lavagem' || k === 'Impermeab.' ? 40 : k === 'Pés G-Roupa' ? 7 : 10)), 0);
    
    const pComissaoBase = pTotal * 0.022;
    const aComissao = aTotal * (aPerc >= 1 ? 0.10 : 0.05);
    const accelBonus = pTotal * (level > 0 ? targets.levels[level as 1|2|3].rate / 100 : 0);

    return {
      pTotal, aTotal, iTotal, pPerc, aPerc, iPerc, level,
      comissaoProdutos: pComissaoBase,
      comissaoAssistencia: aComissao,
      bonusServicos: totalExtras,
      bonusAcelerador: accelBonus,
      ganhosTotais: pComissaoBase + aComissao + accelBonus + totalExtras,
      faturamentoGeral: pTotal + aTotal + iTotal
    };
  }, [savedSales, targets]);

  const addCustomer = async (data: Omit<Customer, 'id' | 'dataCadastro' | 'totalComprado' | 'pedidosCount'>) => {
    const newCustomer: Omit<Customer, 'id'> = {
      ...data,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      totalComprado: 0,
      pedidosCount: 0
    };
    await addDoc(collection(db, 'customers'), newCustomer);
  };

  const deleteCustomer = async (id: string) => {
    await deleteDoc(doc(db, 'customers', id));
  };

  const updateCustomer = async (updated: Customer) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, 'customers', id), data);
  };

  const renderContent = () => {
    if (activeNav === NavItem.Resumos) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col items-center justify-center p-8 space-y-12"
        >
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-purple-500/40 animate-bounce duration-[3000ms]">
              <ShieldCheck size={48} />
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Conquista <span className="text-purple-600">App</span></h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em]">Ecossistema de Alta Performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveNav(NavItem.Resumos)}
              className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center text-center space-y-6 group transition-all hover:border-purple-200"
            >
              <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                <Zap size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">CRM Quantum</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Gestão de Vendas & Bônus</p>
              </div>
              <div className="w-12 h-1 bg-purple-100 rounded-full group-hover:w-24 group-hover:bg-purple-600 transition-all duration-500"></div>
            </motion.button>

            <div className="bg-gray-50/50 p-10 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-6 opacity-60 grayscale">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
                <Star size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-400 uppercase italic tracking-tighter">Treinamentos</h3>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2">Em breve</p>
              </div>
            </div>

            <div className="bg-gray-50/50 p-10 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-6 opacity-60 grayscale">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
                <Target size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-400 uppercase italic tracking-tighter">Metas Equipe</h3>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2">Em breve</p>
              </div>
            </div>
          </div>

          <div className="pt-12">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sistema Operacional Conquista v1.0</span>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeNav === NavItem.Processos) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Fluxo de Vendas</h2>
            <div className="flex gap-2">
              <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600">
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 h-full min-h-[600px]">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wider">{stage.label}</h3>
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {MOCK_OPPORTUNITIES.filter(o => o.stage === stage.id).length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-100/50 rounded-xl p-3 space-y-3 border border-gray-200/50">
                  {MOCK_OPPORTUNITIES.filter(o => o.stage === stage.id).map((opp) => (
                    <motion.div 
                      key={opp.id}
                      layoutId={opp.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 rounded">{opp.type}</span>
                        <span className="text-[10px] text-gray-400">{opp.daysAgo}d</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">{opp.title}</h4>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold text-gray-900">{formatBRL(opp.value)}</div>
                        <img src={opp.user.avatar} className="w-6 h-6 rounded-full border border-gray-200" alt={opp.user.name} />
                      </div>
                    </motion.div>
                  ))}
                  <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                    <Plus size={16} /> Novo Card
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeNav === NavItem.AdicionarVenda) return <SaleForm onCancel={() => setActiveNav(NavItem.Resumos)} onSubmit={saveSale} customers={customers} />;
    if (activeNav === NavItem.Clientes) return (
      <Customers 
        customers={customers} 
        onAdd={addCustomer} 
        onDelete={deleteCustomer} 
        onUpdate={updateCustomer} 
      />
    );
    if (activeNav === NavItem.Configuracoes) return (
      <Settings 
        targets={targets} 
        onSave={saveTargets} 
        onClose={() => setActiveNav(NavItem.Resumos)} 
        showInstallBtn={showInstallBtn}
        onInstall={handleInstallApp}
      />
    );

    if (activeNav === NavItem.Meta) {
      const data = [
        { name: 'Produtos', value: stats.pTotal, target: targets.product, fill: '#9333ea' },
        { name: 'Assistência', value: stats.aTotal, target: targets.assistance, fill: '#10b981' },
        { name: 'Impermeab.', value: stats.iTotal, target: targets.waterproofing, fill: '#6366f1' },
      ];

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 pb-20"
        >
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Minhas Metas</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Progresso em Tempo Real</span>
            </div>
            <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {data.map((item) => {
              const perc = item.target > 0 ? (item.value / item.target) * 100 : 0;
              return (
                <div key={item.name} className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.name}</span>
                      <div className="text-2xl font-black text-gray-900">{formatBRL(item.value)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta</span>
                      <div className="text-sm font-black text-gray-500">{formatBRL(item.target)}</div>
                    </div>
                  </div>
                  
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(perc, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute h-full rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-gray-900">{perc.toFixed(1)}%</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase">Faltam {formatBRL(Math.max(0, item.target - item.value))}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-4 shadow-sm">
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em]">Status do Acelerador</h3>
            <div className="flex justify-center items-center gap-8">
              {[1, 2, 3].map(lvl => (
                <div key={lvl} className={`flex flex-col items-center gap-2 ${stats.level >= lvl ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${stats.level >= lvl ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}>
                    <Zap size={20} className={stats.level >= lvl ? 'text-purple-600' : 'text-gray-300'} />
                  </div>
                  <span className="text-[10px] font-black text-gray-800">Lvl {lvl}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-medium text-gray-500 max-w-[200px] mx-auto">
              {stats.level === 3 
                ? "Parabéns! Você atingiu o nível máximo de aceleração." 
                : `Atinga ${targets.levels[(stats.level + 1) as 1|2|3]?.threshold}% em todas as categorias para o Nível ${stats.level + 1}.`}
            </p>
          </div>
        </motion.div>
      );
    }

    if (activeNav === NavItem.ResumoServico) {
      const serviceData = [
        { name: 'Montagem', count: 0, bonus: 10, color: '#9333ea' },
        { name: 'Lavagem', count: 0, bonus: 40, color: '#6366f1' },
        { name: 'Almofada', count: 0, bonus: 10, color: '#10b981' },
        { name: 'Pés G-Roupa', count: 0, bonus: 7, color: '#f59e0b' },
        { name: 'Impermeab.', count: 0, bonus: 40, color: '#ec4899' },
      ];

      savedSales.forEach(s => {
        s.servicosExtras.forEach(ex => {
          const item = serviceData.find(d => d.name === ex);
          if (item) item.count++;
        });
      });

      const totalServiceBonus = serviceData.reduce((acc, d) => acc + (d.count * d.bonus), 0);

      return (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 pb-20"
        >
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Serviços</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Resumo de Extras</span>
            </div>
            <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 flex flex-col items-center justify-center space-y-2 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ganhos Extras Totais</span>
            <div className="text-4xl font-black text-emerald-600">{formatBRL(totalServiceBonus)}</div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {serviceData.map((item) => (
              <div key={item.name} className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}20` }}>
                    <Wrench size={18} style={{ color: item.color }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">{item.name}</span>
                    <div className="text-[8px] font-bold text-gray-400 uppercase">{item.count} Realizados</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-gray-900">{formatBRL(item.count * item.bonus)}</div>
                  <div className="text-[8px] font-bold text-emerald-600 uppercase">+{formatBRL(item.bonus)}/un</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    if (activeNav === NavItem.Relatorios) {
      const filteredSales = savedSales.filter(s => {
        const diffTime = Math.abs(Date.now() - s.timestamp);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= reportPeriod;
      });

      const periodStats = {
        total: filteredSales.reduce((acc, s) => acc + s.total, 0),
        bonus: filteredSales.reduce((acc, s) => acc + s.bonusTotal, 0),
        count: filteredSales.length,
        products: filteredSales.reduce((acc, s) => acc + s.valorProduto, 0),
        assistance: filteredSales.reduce((acc, s) => acc + s.valorAssistencia, 0),
        water: filteredSales.reduce((acc, s) => acc + s.valorImpermeabilizacao, 0),
        comissaoProd: filteredSales.reduce((acc, s) => acc + (s.valorProduto * 0.022), 0),
        comissaoAssis: filteredSales.reduce((acc, s) => acc + (s.valorAssistencia * 0.05), 0), // Base 5% para o relatório
        bonusServ: filteredSales.reduce((acc, s) => {
          const sCounts = { 'Montagem': 0, 'Lavagem': 0, 'Almofada': 0, 'Pés G-Roupa': 0, 'Impermeab.': 0 };
          s.servicosExtras.forEach(ex => { if (sCounts.hasOwnProperty(ex)) (sCounts as any)[ex]++; });
          return acc + Object.keys(sCounts).reduce((a, k) => a + ((sCounts as any)[k] * (k === 'Lavagem' || k === 'Impermeab.' ? 40 : k === 'Pés G-Roupa' ? 7 : 10)), 0);
        }, 0)
      };

      const sharePeriodReport = () => {
        const text = `Relatório CRM - Últimos ${reportPeriod} dias\n` +
          `Período: ${reportPeriod} dias\n` +
          `Total de Pedidos: ${periodStats.count}\n` +
          `Venda Total: ${formatBRL(periodStats.total)}\n` +
          `Bônus Acumulado: ${formatBRL(periodStats.bonus)}\n` +
          `-------------------\n` +
          filteredSales.map(s => {
            const items = [];
            if (s.valorProduto > 0) items.push("Produto");
            if (s.valorAssistencia > 0) items.push("Assistência");
            if (s.valorImpermeabilizacao > 0) items.push("Impermeabilização");
            if (s.servicosExtras && s.servicosExtras.length > 0) items.push(...s.servicosExtras);
            
            return `Pedido #${s.numeroPedido}: ${formatBRL(s.total)}\nItems: ${items.join(', ')}`;
          }).join('\n\n');

        if (navigator.share) {
          navigator.share({ title: `Relatório ${reportPeriod} dias`, text });
        } else {
          navigator.clipboard.writeText(text);
          alert('Relatório copiado para a área de transferência!');
        }
      };

      return (
        <div className="content-section py-2 px-2 space-y-6 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
             <div>
                <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Relatórios</h2>
                <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Consolidado por Período</span>
             </div>
             <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[5, 10, 15, 30].map(days => (
              <button
                key={days}
                onClick={() => setReportPeriod(days)}
                className={`flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
                  reportPeriod === days 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-white text-gray-400 border border-gray-200'
                }`}
              >
                {days} Dias
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Venda Total</span>
              <div className="text-xl font-black text-gray-900">{formatBRL(periodStats.total)}</div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm">
              <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">Bônus Total</span>
              <div className="text-xl font-black text-emerald-600">{formatBRL(periodStats.bonus)}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Ganhos no Período</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Comissão Produtos</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.comissaoProd)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Comissão Garantia (Base)</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.comissaoAssis)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Bônus Serviços Fixos</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.bonusServ)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume de Vendas</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Total de Pedidos</span>
                <span className="text-gray-900 font-bold">{periodStats.count}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Produtos</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.products)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Assistência</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.assistance)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Impermeabilização</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.water)}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={sharePeriodReport}
            className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
          >
            Compartilhar Relatório ({reportPeriod} Dias)
          </button>
        </div>
      );
    }

    if (activeNav === NavItem.ResumoPedido) {
      return (
        <div className="content-section py-2 px-2 space-y-6 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
             <div>
                <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Histórico</h2>
                <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Todos os Pedidos</span>
             </div>
             <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="space-y-3">
             {savedSales.length === 0 ? (
               <div className="bg-white p-10 rounded-3xl text-center border border-gray-200 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum pedido encontrado</p>
               </div>
             ) : (
               savedSales.map((sale, i) => (
                 <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="flex flex-col text-left hover:opacity-70 transition-opacity"
                    >
                       <span className="text-[10px] font-black text-purple-600 underline decoration-purple-200 underline-offset-4">#{sale.numeroPedido}</span>
                       <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{sale.data}</span>
                    </button>
                    <div className="text-right">
                       <div className="text-[11px] font-black text-emerald-600">{formatBRL(sale.total)}</div>
                       <div className="text-[8px] font-bold text-gray-400 uppercase">Total</div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="content-section py-2 px-2 space-y-6"
      >
        <div className="bg-white p-6 rounded-3xl border border-gray-200 flex items-center justify-between shadow-sm">
           <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">V&C Hub</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Gestão de Vendas</span>
           </div>
           <button onClick={() => setActiveNav(NavItem.AdicionarVenda)} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Novo Pedido</button>
        </div>

        {/* Status de Conexão */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-fit text-[8px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
           {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
           {isOnline ? 'Sincronizado Cloud' : 'Modo Offline'}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">Performance Semanal</span>
              <BarChart size={18} className="text-purple-600" />
           </div>
           
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <RechartsBarChart data={savedSales.slice(0, 7).reverse()}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                 <XAxis 
                   dataKey="data" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 900 }} 
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#9333ea', fontSize: '10px', fontWeight: 'bold' }}
                   labelStyle={{ color: '#64748b', fontSize: '8px', marginBottom: '4px' }}
                 />
                 <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                   {savedSales.slice(0, 7).reverse().map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 6 ? '#9333ea' : '#e2e8f0'} />
                   ))}
                 </Bar>
               </RechartsBarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">Nível de Performance: {stats.level}</span>
              <CloudLightning size={18} className="text-purple-600 animate-pulse" />
           </div>
           <div className="space-y-6">
              {[
                { label: 'Venda Geral', current: stats.pPerc, color: 'bg-purple-600' },
                { label: 'Assistência', current: stats.aPerc, color: 'bg-emerald-500' },
                { label: 'Impermeab.', current: stats.iPerc, color: 'bg-indigo-500' },
              ].map((cat) => (
                <div key={cat.label} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">{cat.label}</span>
                      <span className="text-gray-900">{(cat.current * 100).toFixed(1)}%</span>
                   </div>
                   <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(cat.current * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${cat.color} rounded-full`}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Faturamento</span>
              <div className="text-lg font-black text-gray-900">{formatBRL(stats.faturamentoGeral)}</div>
           </div>
           <button 
             onClick={() => setActiveNav(NavItem.Relatorios)}
             className="bg-purple-50 p-6 rounded-3xl border border-purple-100 text-left active:scale-95 transition-all group"
           >
              <span className="text-[8px] font-black text-purple-600 uppercase block mb-1">Ver Relatórios</span>
              <div className="text-lg font-black text-purple-600 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Acessar <BarChart size={14} />
              </div>
           </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Detalhamento de Ganhos</h3>
              <div className="text-2xl font-black text-emerald-600">{formatBRL(stats.ganhosTotais)}</div>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Comissão Produtos (2.2%)</span>
                 <span className="text-[11px] font-black text-gray-900">{formatBRL(stats.comissaoProdutos)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Comissão Garantia</span>
                 <span className="text-[11px] font-black text-gray-900">{formatBRL(stats.comissaoAssistencia)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Bônus Serviços Fixos</span>
                 <span className="text-[11px] font-black text-gray-900">{formatBRL(stats.bonusServicos)}</span>
              </div>
              {stats.bonusAcelerador > 0 && (
                <div className="flex justify-between items-center p-4 rounded-2xl bg-purple-50 border border-purple-100">
                   <span className="text-[9px] font-bold text-purple-600 uppercase">Bônus Acelerador (Nível {stats.level})</span>
                   <span className="text-[11px] font-black text-purple-600">{formatBRL(stats.bonusAcelerador)}</span>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-3">
           <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Últimas Atividades</h3>
           {filteredSales.slice(0, 5).map((sale, i) => (
             <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <button 
                  onClick={() => setSelectedSale(sale)}
                  className="flex flex-col text-left hover:opacity-70 transition-opacity"
                >
                   <span className="text-[10px] font-black text-purple-600 underline decoration-purple-200 underline-offset-4">#{sale.numeroPedido}</span>
                   <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{sale.data}</span>
                </button>
                <div className="text-right">
                   <div className="text-[11px] font-black text-emerald-600">{formatBRL(sale.bonusTotal)}</div>
                   <div className="text-[8px] font-bold text-gray-400 uppercase">Bônus</div>
                </div>
             </div>
           ))}
        </div>
      </motion.div>
    );
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-row selection:bg-purple-500/30 overflow-hidden font-sans">
      <InstallPrompt />
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        activeItem={activeNav} 
        onSelect={(item) => { 
          setActiveNav(item); 
        }} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
               <Layout size={18} />
             </div>
             <h1 className="text-lg font-bold text-gray-800 tracking-tight">CRM <span className="text-purple-600">V&C</span></h1>
           </div>
           
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                 {isOnline ? 'Online' : 'Offline'}
              </div>
              <button 
                onClick={() => setActiveNav(NavItem.Configuracoes)}
                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              >
                <Wrench size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
                 <img src="https://picsum.photos/seed/vc/100/100" alt="Avatar" />
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>

        {/* BOTÃO FLUTUANTE DIRETO */}
        <div className="fixed bottom-8 right-8 z-40">
           <button 
             onClick={() => setActiveNav(NavItem.AdicionarVenda)} 
             className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/40 active:scale-90 transition-all duration-300 hover:bg-purple-700"
           >
              <Plus size={32} strokeWidth={2.5} />
           </button>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedSale(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 italic tracking-tighter uppercase">Pedido #{selectedSale.numeroPedido}</h3>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">{selectedSale.data}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-3">Composição da Venda</span>
                  <div className="space-y-3">
                    {selectedSale.clienteId && (
                      <div className="flex justify-between text-[11px] border-b border-gray-100 pb-2 mb-2">
                        <span className="text-gray-500 uppercase">Cliente</span>
                        <span className="text-purple-600 font-black">{customers.find(c => c.id === selectedSale.clienteId)?.nome || 'Não encontrado'}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 uppercase">Produtos</span>
                      <span className="text-gray-900 font-bold">{formatBRL(selectedSale.valorProduto)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 uppercase">Assistência</span>
                      <span className="text-gray-900 font-bold">{formatBRL(selectedSale.valorAssistencia)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 uppercase">Impermeabilização</span>
                      <span className="text-gray-900 font-bold">{formatBRL(selectedSale.valorImpermeabilizacao)}</span>
                    </div>
                  </div>
                </div>

                {selectedSale.servicosExtras.length > 0 && (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-3">Serviços Extras</span>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedSale.servicosExtras.map((serv, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-50 border border-purple-100 rounded-lg text-[9px] font-black text-purple-600 uppercase">
                          {serv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">Ganhos</span>
                    <div className="text-xl font-black text-emerald-600">{formatBRL(selectedSale.bonusTotal)}</div>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Total Pedido</span>
                    <div className="text-xl font-black text-gray-900">{formatBRL(selectedSale.total)}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Detalhamento de Ganhos</span>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase">Comissão Produto (2.2%)</span>
                    <span className="text-gray-900 font-bold">{formatBRL(selectedSale.comissaoProduto)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase">Garantia + Serviços</span>
                    <span className="text-gray-900 font-bold">{formatBRL(selectedSale.bonusTotal - selectedSale.comissaoProduto)}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const items = [];
                  if (selectedSale.valorProduto > 0) items.push("Produto");
                  if (selectedSale.valorAssistencia > 0) items.push("Assistência");
                  if (selectedSale.valorImpermeabilizacao > 0) items.push("Impermeabilização");
                  if (selectedSale.servicosExtras && selectedSale.servicosExtras.length > 0) items.push(...selectedSale.servicosExtras);

                  const text = `Relatório Pedido #${selectedSale.numeroPedido}\n` +
                    `Data: ${selectedSale.data}\n` +
                    `Total: ${formatBRL(selectedSale.total)}\n` +
                    `Bônus: ${formatBRL(selectedSale.bonusTotal)}\n` +
                    `-------------------\n` +
                    `Items: ${items.join(', ')}`;
                  
                  if (navigator.share) {
                    navigator.share({ title: `Pedido ${selectedSale.numeroPedido}`, text });
                  } else {
                    navigator.clipboard.writeText(text);
                    alert('Copiado para a área de transferência!');
                  }
                }}
                className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
              >
                Compartilhar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
