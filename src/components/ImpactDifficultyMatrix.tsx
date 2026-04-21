import React, { useState } from 'react';
import { AppData, Opportunity, Process, Activity } from '../types';
import { Info } from 'lucide-react';

interface ImpactDifficultyMatrixProps {
  data: AppData;
  isPrintMode?: boolean;
}

export const ImpactDifficultyMatrix: React.FC<ImpactDifficultyMatrixProps> = ({ data, isPrintMode = false }) => {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  // Group opportunities by their coordinates (difficulty, impact)
  const grid: { [key: string]: Opportunity[] } = {};
  
  data.opportunities.forEach(opp => {
    const key = `${opp.difficulty}-${opp.impact}`;
    if (!grid[key]) {
      grid[key] = [];
    }
    grid[key].push(opp);
  });

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'bg-indigo-600 border-white scale-150 z-20 shadow-lg';
    
    switch (status) {
      case 'Finalizada': return 'bg-emerald-500 border-white shadow-sm z-10';
      case 'En curso': return 'bg-blue-500 border-white shadow-sm z-10';
      case 'Planificado': return 'bg-amber-500 border-white shadow-sm z-10';
      case 'Propuesta': return 'bg-indigo-500 border-white shadow-sm z-10';
      case 'No priorizado': return 'bg-slate-400 border-white shadow-sm z-10';
      case 'Tests': return 'bg-purple-500 border-white shadow-sm z-10';
      default: return 'bg-gray-400 border-white shadow-sm z-10';
    }
  };

  const getProcessName = (processId: string) => {
    return data.processes.find(p => p.id === processId)?.name || 'Proceso Desconocido';
  };

  const getActivityName = (processId: string) => {
    const process = data.processes.find(p => p.id === processId);
    if (!process) return 'Actividad Desconocida';
    return data.activities.find(a => a.id === process.activityId)?.name || 'Actividad Desconocida';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col ${isPrintMode ? 'h-full shadow-none border-none p-0' : 'h-[calc(100vh-8rem)]'}`}>
      <div className={`mb-6 w-full text-left flex justify-between items-end ${isPrintMode ? 'print:hidden' : ''}`}>
        <div>
          <h2 className="text-xl font-bold text-gray-800 text-left">Matriz Impacto / Dificultad</h2>
          <p className="text-sm text-gray-500 mt-1 text-left">
            Visualización de iniciativas para priorización. Alto impacto y baja dificultad representan "Quick Wins".
          </p>
        </div>
        
        <div className="flex gap-4 text-xs font-medium text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Finalizada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>En curso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Planificado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>Propuesta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span>No priorizado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Tests</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Matrix Area */}
        <div className="flex-1 relative flex flex-col">
          {/* Y-axis label */}
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-gray-600 tracking-wider">
            IMPACTO
          </div>

          <div className="flex-1 border-l-2 border-b-2 border-gray-800 relative ml-4 mb-4 bg-gray-50/50 min-h-[300px]">
            {/* Quadrant Backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20 pointer-events-none">
              <div className="bg-green-200 border-r border-b border-gray-300"></div> {/* Top Left: Quick Wins */}
              <div className="bg-blue-200 border-b border-gray-300"></div> {/* Top Right: Major Projects */}
              <div className="bg-yellow-200 border-r border-gray-300"></div> {/* Bottom Left: Fill Ins */}
              <div className="bg-red-200"></div> {/* Bottom Right: Thankless Tasks */}
            </div>

            {/* Quadrant Labels */}
            <div className="absolute top-4 left-4 text-green-700 font-bold opacity-50 pointer-events-none">Quick Wins</div>
            <div className="absolute top-4 right-4 text-blue-700 font-bold opacity-50 pointer-events-none">Proyectos Mayores</div>
            <div className="absolute bottom-4 left-4 text-yellow-700 font-bold opacity-50 pointer-events-none">Rellenos</div>
            <div className="absolute bottom-4 right-4 text-red-700 font-bold opacity-50 pointer-events-none">Tareas Ingratas</div>

            {/* Grid Lines (1 to 5) */}
            {[1, 2, 3, 4, 5].map(val => (
              <React.Fragment key={val}>
                {/* Horizontal lines (Impact) */}
                <div 
                  className="absolute w-full border-t border-gray-200 border-dashed"
                  style={{ bottom: `${(val - 1) * 25}%` }}
                />
                {/* Vertical lines (Difficulty) */}
                <div 
                  className="absolute h-full border-l border-gray-200 border-dashed"
                  style={{ left: `${(val - 1) * 25}%` }}
                />
              </React.Fragment>
            ))}

              {/* Points */}
            <div className="absolute inset-0 m-4 pointer-events-none">
              {data.opportunities.map((opp) => {
                // Map 1-5 to 0-100%
                const left = `${(opp.difficulty - 1) * 25}%`;
                const bottom = `${(opp.impact - 1) * 25}%`;
                
                // Add some jitter if multiple items are at the same coordinate
                const key = `${opp.difficulty}-${opp.impact}`;
                const siblings = grid[key] || [];
                const index = siblings.findIndex(s => s.id === opp.id);
                
                // Calculate offset for overlapping points
                const offsetSize = isPrintMode ? 12 : 8;
                const offset = siblings.length > 1 ? (index - (siblings.length - 1) / 2) * offsetSize : 0;

                const isSelected = selectedOpp?.id === opp.id;
                const dotSize = isPrintMode ? 'w-5 h-5 -ml-2.5 -mb-2.5' : 'w-4 h-4 -ml-2 -mb-2';

                return (
                  <button
                    key={opp.id}
                    onClick={() => !isPrintMode && setSelectedOpp(opp)}
                    className={`absolute ${dotSize} rounded-full border-2 transition-all transform ${!isPrintMode ? 'hover:scale-150 hover:z-10' : ''} ${
                      getStatusColor(opp.status, isSelected)
                    } print:border-white print:shadow-none`}
                    style={{ 
                      left: `calc(${left} + ${offset}px)`, 
                      bottom: `calc(${bottom} + ${offset}px)` 
                    }}
                    title={opp.name}
                  >
                    {isPrintMode && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100">
                        {opp.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* X-axis label */}
          <div className="text-center text-sm font-semibold text-gray-600 tracking-wider ml-4">
            DIFICULTAD
          </div>
          
          {/* Axis markers */}
          <div className="absolute left-4 bottom-0 translate-y-full text-xs text-gray-400 mt-1">Baja (1)</div>
          <div className="absolute right-0 bottom-0 translate-y-full text-xs text-gray-400 mt-1">Alta (5)</div>
          <div className="absolute left-0 bottom-4 -translate-x-full text-xs text-gray-400 mr-1">Bajo (1)</div>
          <div className="absolute left-0 top-0 -translate-x-full text-xs text-gray-400 mr-1">Alto (5)</div>
        </div>

        {/* Details Panel */}
        {!isPrintMode && (
          <div className="w-80 bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Detalles de Iniciativa
            </h3>
            
            {selectedOpp ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Nombre</div>
                  <div className="font-medium text-gray-900">{selectedOpp.name}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Actividad</div>
                  <div className="text-sm text-gray-800">{getActivityName(selectedOpp.processId)}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Proceso</div>
                  <div className="text-sm text-gray-800">{getProcessName(selectedOpp.processId)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Impacto</div>
                    <div className="text-xl font-bold text-indigo-600">{selectedOpp.impact}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Dificultad</div>
                    <div className="text-xl font-bold text-indigo-600">{selectedOpp.difficulty}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Prioridad</div>
                  <div className="text-sm text-gray-800">{selectedOpp.priority}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Estado</div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    selectedOpp.status === 'Finalizada' ? 'bg-emerald-100 text-emerald-800' :
                    selectedOpp.status === 'En curso' ? 'bg-blue-100 text-blue-800' :
                    selectedOpp.status === 'Planificado' ? 'bg-amber-100 text-amber-800' :
                    selectedOpp.status === 'Propuesta' ? 'bg-indigo-100 text-indigo-800' :
                    selectedOpp.status === 'No priorizado' ? 'bg-slate-100 text-slate-800' :
                    selectedOpp.status === 'Tests' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOpp.status}
                  </span>
                </div>

                {selectedOpp.notes && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Notas</div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{selectedOpp.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
                </div>
                <p className="text-sm">Selecciona un punto en la matriz para ver sus detalles</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
