
import React from 'react';
import { PIPELINE_STAGES } from '../constants';
import { Opportunity } from '../tipos';
import { MoreHorizontal, Plus } from 'lucide-react';

interface PipelineViewProps {
  opportunities: Opportunity[];
}

const PipelineView: React.FC<PipelineViewProps> = ({ opportunities }) => {
  const formattedCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide min-h-[500px]">
      {PIPELINE_STAGES.map((stage) => {
        const stageOpportunities = opportunities.filter(o => o.stage === stage.id);
        const totalValue = stageOpportunities.reduce((sum, o) => sum + o.value, 0);

        return (
          <div key={stage.id} className="min-w-[260px] max-w-[260px] flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${stage.color} shadow-sm`}></div>
                <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest italic">{stage.label}</h4>
                <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-md font-black border border-gray-200">
                  {stageOpportunities.length}
                </span>
              </div>
              <button className="text-gray-400 hover:text-purple-600 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider italic">Acumulado</span>
              <span className="text-xs font-black text-gray-900">{formattedCurrency(totalValue)}</span>
            </div>

            <div className="space-y-3">
              {stageOpportunities.map((op) => (
                <div 
                  key={op.id}
                  className="bg-white border border-gray-200 p-4 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md"
                >
                   <div className={`absolute top-0 left-0 w-full h-0.5 ${stage.color} opacity-50`}></div>
                  <div className="flex justify-between items-start mb-3">
                    <img 
                      src={op.user.avatar} 
                      alt={op.user.name} 
                      className="w-7 h-7 rounded-lg border border-gray-100" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[9px] font-black text-gray-400">{op.id}</span>
                  </div>
                  <h5 className="font-bold text-gray-700 text-xs mb-1 group-hover:text-purple-600 transition-colors truncate italic">
                    {op.title}
                  </h5>
                  <p className="text-[10px] text-gray-500 mb-4">{op.type}</p>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="font-black text-gray-900 text-xs">
                      {formattedCurrency(op.value)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold">{op.daysAgo}D</span>
                  </div>
                </div>
              ))}
              
              <button className="w-full py-3 border border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-purple-500/30 hover:text-purple-600 transition-all flex items-center justify-center gap-2 group bg-white/50">
                <Plus size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Adicionar</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineView;
