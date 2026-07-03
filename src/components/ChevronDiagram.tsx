import React, { useState } from 'react';
import { AppData, Opportunity } from '../types';
import { Plus, Trash2, AlertCircle, Lock, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';
import { OpportunityDetailsModal } from './OpportunityDetailsModal';

const ADMIN_EMAIL = 'migcormar@gmail.com';

interface ChevronDiagramProps {
  data: AppData;
  onDeleteOpportunity: (id: string) => void;
  user: User | null;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800 border-green-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-orange-100 text-orange-800 border-orange-200',
  5: 'bg-red-100 text-red-800 border-red-200',
};

export function ChevronDiagram({ data, onDeleteOpportunity, user, setData }: ChevronDiagramProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const sortedActivities = [...data.activities].sort((a, b) => a.order - b.order);
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        No hay datos para visualizar. Añade actividades y procesos en la tabla o carga un Excel.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto pb-8">
      <div className="flex min-w-max gap-2 p-4">
        {sortedActivities.map((activity, index) => {
          const processList = data.processes
            .filter(p => p.activityId === activity.id)
            .sort((a, b) => a.order - b.order);

          const activityOppCount = processList.reduce((acc, p) => {
            return acc + data.opportunities.filter(o => o.processId === p.id).length;
          }, 0);

          return (
            <div key={activity.id} className="flex flex-col w-72 shrink-0">
              {/* Chevron Header */}
              <div className={cn(
                "bg-indigo-600 text-white p-4 h-16 flex items-center justify-center font-semibold text-center shadow-md mb-4 sticky top-0 z-20 relative",
                index === 0 ? "chevron-first" : index === sortedActivities.length - 1 ? "chevron-last" : "chevron-middle",
                sortedActivities.length === 1 && "chevron-single"
              )}>
                <span className="truncate px-12 leading-tight">{activity.name}</span>
                <div 
                  className="absolute right-8 text-xs font-bold bg-white/20 w-6 h-6 flex items-center justify-center rounded-full shrink-0"
                  title={`${activityOppCount} ${activityOppCount === 1 ? 'iniciativa' : 'iniciativas'}`}
                >
                  {activityOppCount}
                </div>
              </div>

              {/* Processes List */}
              <div className="flex flex-col gap-4 px-2">
                {processList.map(process => {
                  const opps = data.opportunities.filter(o => o.processId === process.id);
                  
                  return (
                    <div key={process.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-3">
                      <div className="border-b pb-2">
                        <h4 className="font-medium text-gray-800 leading-tight">{process.name}</h4>
                        {process.applicationIds && process.applicationIds.length > 0 && (
                          <p className="text-xs text-indigo-600 mt-1 font-medium bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
                            App: {(process.applicationIds || []).map(id => data.applications.find(a => a.id === id)?.name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      
                      {/* Opportunities */}
                      <div className="flex flex-col gap-2">
                        {opps.map(opp => (
                          <div key={opp.id} className={cn("flex items-start justify-between p-2 rounded border text-sm", PRIORITY_COLORS[opp.priority] || PRIORITY_COLORS[3])}>
                            <div className="flex items-start gap-2">
                              <button 
                                onClick={() => setSelectedOpportunity(opp)} 
                                className="mt-0.5 text-gray-500 hover:text-indigo-700 transition-colors shrink-0" 
                                title="Ver detalles"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium leading-tight">{opp.name}</span>
                                  {!isAdmin && opp.createdBy && opp.createdBy !== user?.uid && (
                                    <Lock className="w-3 h-3 text-gray-400 shrink-0" title="Solo lectura" />
                                  )}
                                </div>
                                <div className="flex gap-2 mt-1.5 text-[10px] opacity-90 font-medium items-center flex-wrap">
                                  <span className="bg-white/40 px-1.5 py-0.5 rounded border border-black/5">Imp: {opp.impact}</span>
                                  <span className="bg-white/40 px-1.5 py-0.5 rounded border border-black/5">Dif: {opp.difficulty}</span>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded border border-black/5",
                                    opp.status === 'No priorizado' ? "bg-indigo-200 text-indigo-900" : "bg-white/40"
                                  )}>{opp.status}</span>
                                </div>
                                {opp.notes && (
                                  <div className="mt-1.5 text-xs opacity-80 italic leading-snug">
                                    {opp.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                            {(isAdmin || (opp.createdBy === user?.uid)) && (
                              <button 
                                onClick={() => onDeleteOpportunity(opp.id)}
                                className="text-gray-500 hover:text-red-600 transition-colors ml-2 shrink-0"
                                title="Eliminar oportunidad"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          const newId = crypto.randomUUID();
                          const newOpp = { 
                            id: newId, 
                            processId: process.id, 
                            name: 'Nueva Oportunidad', 
                            priority: 3,
                            impact: 3,
                            difficulty: 3,
                            status: 'Planificado' as const,
                            proposedBy: user?.displayName || user?.email || '',
                            createdBy: user?.uid
                          };
                          setData(prev => ({
                            ...prev,
                            opportunities: [...prev.opportunities, newOpp]
                          }));
                          setSelectedOpportunity(newOpp);
                        }}
                        className="flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 py-1.5 rounded transition-colors mt-1 border border-dashed border-indigo-200"
                      >
                        <Plus className="w-3 h-3" />
                        Añadir Oportunidad
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOpportunity && (
        <OpportunityDetailsModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onSave={(updatedOpportunity) => {
            setData(prev => ({
              ...prev,
              opportunities: prev.opportunities.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o)
            }));
            setSelectedOpportunity(null);
          }}
        />
      )}
    </div>
  );
}
