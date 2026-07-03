import React, { useState } from 'react';
import { AppData } from '../types';
import { Plus, Trash2, Edit2, Check, X, ChevronUp, ChevronDown, ExternalLink, Building2, Loader2 } from 'lucide-react';

interface MasterDataProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export function MasterData({ data, setData }: MasterDataProps) {
  const [activeTab, setActiveTab] = useState<'activities' | 'processes' | 'applications'>('activities');
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');

  const [showCifModal, setShowCifModal] = useState(false);
  const [cifValue, setCifValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateByCif = async () => {
    if (!cifValue) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-process-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cif: cifValue }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.activities && result.processes) {
          const newActivities = result.activities.map((a: any, i: number) => ({
            id: crypto.randomUUID(),
            name: a.name,
            order: data.activities.length + i,
            _tempId: a.id
          }));
          const newProcesses = result.processes.map((p: any, i: number) => {
            const parentActivity = newActivities.find((a: any) => a._tempId === p.activityId);
            return {
              id: crypto.randomUUID(),
              activityId: parentActivity ? parentActivity.id : newActivities[0]?.id || data.activities[0]?.id,
              name: p.name,
              order: data.processes.length + i,
              applicationIds: []
            };
          });
          
          const cleanActivities = newActivities.map((a: any) => {
            const { _tempId, ...rest } = a;
            return rest;
          });

          setData(prev => ({
            ...prev,
            activities: [...prev.activities, ...cleanActivities],
            processes: [...prev.processes, ...newProcesses]
          }));
          setShowCifModal(false);
          setCifValue('');
        }
      } else {
        alert('Error al generar la propuesta. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startEdit = (id: string, field: string, currentValue: string | number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    
    setData(prev => {
      if (activeTab === 'applications') {
        if (field === 'name') {
          return { ...prev, applications: prev.applications.map(a => a.id === id ? { ...a, name: String(editValue) } : a) };
        }
      }
      if (activeTab === 'activities') {
        if (field === 'name') {
          return { ...prev, activities: prev.activities.map(a => a.id === id ? { ...a, name: String(editValue) } : a) };
        }
        if (field === 'order') {
          return { ...prev, activities: prev.activities.map(a => a.id === id ? { ...a, order: Number(editValue) } : a) };
        }
      }
      if (activeTab === 'processes') {
        if (field === 'name') {
          return { ...prev, processes: prev.processes.map(p => p.id === id ? { ...p, name: String(editValue) } : p) };
        }
        if (field === 'order') {
          return { ...prev, processes: prev.processes.map(p => p.id === id ? { ...p, order: Number(editValue) } : p) };
        }
        if (field === 'activityId') {
          return { ...prev, processes: prev.processes.map(p => p.id === id ? { ...p, activityId: String(editValue) } : p) };
        }
      }
      return prev;
    });
    setEditingCell(null);
  };

  const handleAdd = () => {
    const newId = crypto.randomUUID();
    setData(prev => {
      if (activeTab === 'applications') {
        return { ...prev, applications: [...prev.applications, { id: newId, name: 'Nueva Aplicación' }] };
      }
      if (activeTab === 'activities') {
        const maxOrder = prev.activities.reduce((max, a) => Math.max(max, a.order), 0);
        return { ...prev, activities: [...prev.activities, { id: newId, name: 'Nueva Actividad', order: maxOrder + 1 }] };
      }
      if (activeTab === 'processes') {
        if (prev.activities.length === 0) return prev;
        const actId = prev.activities[0].id;
        const maxOrder = prev.processes.filter(p => p.activityId === actId).reduce((max, p) => Math.max(max, p.order), 0);
        return { ...prev, processes: [...prev.processes, { id: newId, activityId: actId, name: 'Nuevo Proceso', order: maxOrder + 1, applicationIds: [] }] };
      }
      return prev;
    });
    startEdit(newId, 'name', activeTab === 'applications' ? 'Nueva Aplicación' : activeTab === 'activities' ? 'Nueva Actividad' : 'Nuevo Proceso');
  };

  const handleDelete = (id: string) => {
    setData(prev => {
      if (activeTab === 'applications') {
        return {
          ...prev,
          applications: prev.applications.filter(a => a.id !== id),
          processes: prev.processes.map(p => ({ ...p, applicationIds: (p.applicationIds || []).filter(appId => appId !== id) }))
        };
      }
      if (activeTab === 'activities') {
        return {
          ...prev,
          activities: prev.activities.filter(a => a.id !== id),
          processes: prev.processes.filter(p => p.activityId !== id),
          opportunities: prev.opportunities.filter(o => !prev.processes.find(p => p.activityId === id && p.id === o.processId))
        };
      }
      if (activeTab === 'processes') {
        return {
          ...prev,
          processes: prev.processes.filter(p => p.id !== id),
          opportunities: prev.opportunities.filter(o => o.processId !== id)
        };
      }
      return prev;
    });
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setData(prev => {
      if (activeTab === 'activities') {
        const sorted = [...prev.activities].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(a => a.id === id);
        if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return prev;
        
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const temp = sorted[idx];
        sorted[idx] = sorted[targetIdx];
        sorted[targetIdx] = temp;
        
        return { ...prev, activities: sorted.map((a, i) => ({ ...a, order: i + 1 })) };
      }
      if (activeTab === 'processes') {
        const process = prev.processes.find(p => p.id === id);
        if (!process) return prev;
        
        const activityProcesses = prev.processes.filter(p => p.activityId === process.activityId).sort((a, b) => a.order - b.order);
        const otherProcesses = prev.processes.filter(p => p.activityId !== process.activityId);
        
        const idx = activityProcesses.findIndex(p => p.id === id);
        if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === activityProcesses.length - 1)) return prev;
        
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const temp = activityProcesses[idx];
        activityProcesses[idx] = activityProcesses[targetIdx];
        activityProcesses[targetIdx] = temp;
        
        const reordered = activityProcesses.map((p, i) => ({ ...p, order: i + 1 }));
        return { ...prev, processes: [...otherProcesses, ...reordered] };
      }
      return prev;
    });
  };

  const renderCell = (id: string, field: string, value: string | number, isSelect: boolean = false, options: {value: string, label: string}[] = []) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;
    
    if (isEditing) {
      if (isSelect) {
        return (
          <select
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => e.key === 'Enter' && saveEdit()}
            className="w-full px-2 py-1 border border-indigo-300 rounded outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            autoFocus
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      }
      return (
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={e => setEditValue(typeof value === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => e.key === 'Enter' && saveEdit()}
          autoFocus
          className="w-full px-2 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-indigo-50 px-2 py-1.5 rounded min-h-[32px] flex items-center transition-colors border border-transparent hover:border-indigo-100"
        onClick={() => startEdit(id, field, value)}
        title="Clic para editar"
      >
        {isSelect ? options.find(o => o.value === value)?.label || value : value}
      </div>
    );
  };

  const renderOrderCell = (id: string, order: number, index: number, maxIndex: number) => {
    const isEditing = editingCell?.id === id && editingCell?.field === 'order';
    
    return (
      <div className="flex items-center justify-between group px-1 min-w-[60px]">
        <div 
          className="flex-1 cursor-pointer hover:bg-indigo-50 rounded px-1 py-1 text-center" 
          onClick={() => startEdit(id, 'order', order)}
          title="Clic para editar"
        >
          {isEditing ? (
            <input 
              type="number" 
              value={editValue} 
              onChange={e => setEditValue(Number(e.target.value))} 
              onBlur={saveEdit} 
              onKeyDown={e => e.key === 'Enter' && saveEdit()} 
              autoFocus 
              className="w-full px-1 py-0.5 border border-indigo-300 rounded text-sm outline-none text-center" 
            />
          ) : (
            <span className="font-medium text-gray-600">{order}</span>
          )}
        </div>
        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button 
            onClick={() => moveItem(id, 'up')} 
            disabled={index === 0} 
            className="text-gray-400 hover:text-indigo-600 disabled:opacity-20"
            title="Mover arriba"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button 
            onClick={() => moveItem(id, 'down')} 
            disabled={index === maxIndex} 
            className="text-gray-400 hover:text-indigo-600 disabled:opacity-20"
            title="Mover abajo"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    let items: any[] = [];
    if (activeTab === 'activities') items = [...data.activities].sort((a, b) => a.order - b.order);
    if (activeTab === 'processes') items = [...data.processes].sort((a, b) => a.order - b.order);
    if (activeTab === 'applications') items = data.applications;

    return (
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-gray-100 text-gray-700 text-sm">
              {activeTab !== 'applications' && <th className="p-3 border-b border-gray-200 w-24">Orden</th>}
              {activeTab === 'processes' && <th className="p-3 border-b border-gray-200 w-64">Actividad</th>}
              <th className="p-3 border-b border-gray-200">Nombre</th>
              <th className="p-3 border-b border-gray-200 w-24 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.map((item, index) => {
              // Calculate maxIndex for processes within the same activity
              let maxIndex = items.length - 1;
              let itemIndex = index;
              if (activeTab === 'processes') {
                const activityProcesses = items.filter(p => p.activityId === item.activityId);
                maxIndex = activityProcesses.length - 1;
                itemIndex = activityProcesses.findIndex(p => p.id === item.id);
              }

              return (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {activeTab !== 'applications' && (
                    <td className="p-2">
                      {renderOrderCell(item.id, item.order, itemIndex, maxIndex)}
                    </td>
                  )}
                  {activeTab === 'processes' && (
                    <td className="p-2">
                      {renderCell(item.id, 'activityId', item.activityId, true, data.activities.map(a => ({ value: a.id, label: a.name })))}
                    </td>
                  )}
                  <td className="p-2">
                    {renderCell(item.id, 'name', item.name)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No hay registros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'activities' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}>Actividades</button>
          <button onClick={() => setActiveTab('processes')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'processes' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}>Procesos</button>
          <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'applications' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}>Aplicaciones</button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCifModal(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Propuesta por CIF
          </button>
          <a 
            href="/apqc-pcf.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Inspirarse en APQC
          </a>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            Añadir {activeTab === 'activities' ? 'Actividad' : activeTab === 'processes' ? 'Proceso' : 'Aplicación'}
          </button>
        </div>
      </div>
      {renderTable()}

      {/* Modal Propuesta CIF */}
      {showCifModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generar Propuesta por CIF</h3>
              <button onClick={() => setShowCifModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Introduce el CIF de la empresa para generar automáticamente una propuesta de actividades y procesos basada en su sector.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">CIF de la Empresa</label>
              <input
                type="text"
                value={cifValue}
                onChange={(e) => setCifValue(e.target.value)}
                placeholder="Ej. B12345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCifModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isGenerating}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateByCif}
                disabled={!cifValue || isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Generar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

