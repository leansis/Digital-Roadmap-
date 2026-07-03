import React, { useState } from 'react';
import { AppData, OpportunityStatus, Opportunity } from '../types';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, ChevronsUpDown, Maximize2 } from 'lucide-react';
import { OpportunityDetailsModal } from './OpportunityDetailsModal';

import { User } from 'firebase/auth';

interface EditableTableProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  user: User | null;
}

export function EditableTable({ data, setData, user }: EditableTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());
  const [appsCollapsed, setAppsCollapsed] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const isAllCollapsed = data.activities.length > 0 && collapsedActivities.size === data.activities.length;

  const toggleAllActivities = () => {
    if (isAllCollapsed) {
      setCollapsedActivities(new Set());
    } else {
      setCollapsedActivities(new Set(data.activities.map(a => a.id)));
    }
  };

  const toggleActivity = (id: string) => {
    setCollapsedActivities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (id: string, field: string, value: string | number) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    
    setData(prev => {
      const newData = { ...prev };
      if (field === 'activity-name') {
        newData.activities = newData.activities.map(a => a.id === id ? { ...a, name: String(editValue) } : a);
      } else if (field === 'activity-order') {
        newData.activities = newData.activities.map(a => a.id === id ? { ...a, order: Number(editValue) } : a);
      } else if (field === 'process-name') {
        newData.processes = newData.processes.map(p => p.id === id ? { ...p, name: String(editValue) } : p);
      } else if (field === 'process-order') {
        newData.processes = newData.processes.map(p => p.id === id ? { ...p, order: Number(editValue) } : p);
      } else if (field === 'opportunity-name') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, name: String(editValue) } : o);
      } else if (field === 'opportunity-priority') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, priority: Number(editValue) } : o);
      } else if (field === 'opportunity-impact') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, impact: Number(editValue) } : o);
      } else if (field === 'opportunity-difficulty') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, difficulty: Number(editValue) } : o);
      } else if (field === 'opportunity-status') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, status: editValue as OpportunityStatus } : o);
      } else if (field === 'opportunity-proposedBy') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, proposedBy: String(editValue) } : o);
      } else if (field === 'opportunity-notes') {
        newData.opportunities = newData.opportunities.map(o => o.id === id ? { ...o, notes: String(editValue) } : o);
      }
      return newData;
    });
    setEditingCell(null);
  };

  const renderCell = (type: 'activity' | 'process' | 'opportunity', id: string, field: 'name' | 'order' | 'priority' | 'impact' | 'difficulty' | 'status' | 'proposedBy' | 'notes', value: string | number) => {
    const isEditing = editingCell?.id === id && editingCell?.field === `${type}-${field}`;
    
    if (isEditing) {
      if (field === 'status') {
        return (
          <select
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => e.key === 'Enter' && saveEdit()}
            className="w-full px-2 py-1 border border-indigo-300 rounded outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            autoFocus
          >
            <option value="Planificado">Planificado</option>
            <option value="En curso">En curso</option>
            <option value="Finalizada">Finalizada</option>
            <option value="No priorizado">No priorizado</option>
            <option value="Tests">Tests</option>
          </select>
        );
      }
      if (field === 'priority' || field === 'impact' || field === 'difficulty') {
        return (
          <select 
            value={editValue} 
            onChange={e => setEditValue(Number(e.target.value))}
            onBlur={saveEdit}
            autoFocus
            className="w-full px-1 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>1 (Baja)</option>
            <option value={2}>2</option>
            <option value={3}>3 (Media)</option>
            <option value={4}>4</option>
            <option value={5}>5 (Alta)</option>
          </select>
        );
      }
      if (field === 'notes') {
        return (
          <textarea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            autoFocus
            className="w-full px-2 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-y"
          />
        );
      }
      return (
        <input
          type={field === 'order' ? 'number' : 'text'}
          value={editValue}
          onChange={e => setEditValue(field === 'order' ? Number(e.target.value) : e.target.value)}
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
        onClick={() => startEdit(id, `${type}-${field}`, value)}
        title="Clic para editar"
      >
        {field === 'status' ? (
          <span className={`text-xs px-2 py-1 rounded-full font-medium w-full text-center ${
            value === 'Planificado' ? 'bg-gray-100 text-gray-700' :
            value === 'En curso' ? 'bg-blue-100 text-blue-700' :
            value === 'Finalizada' ? 'bg-green-100 text-green-700' :
            value === 'No priorizado' ? 'bg-red-100 text-red-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {value}
          </span>
        ) : field === 'priority' || field === 'impact' || field === 'difficulty' ? (
          <span className={`text-xs px-2 py-1 rounded-full font-medium w-full text-center ${
            value === 5 ? 'bg-red-100 text-red-800' :
            value === 4 ? 'bg-orange-100 text-orange-800' :
            value === 3 ? 'bg-yellow-100 text-yellow-800' :
            value === 2 ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {value}
          </span>
        ) : field === 'notes' ? (
          <span className="text-gray-600 text-xs italic line-clamp-2 w-full" title={String(value)}>{value || <span className="text-gray-300">Añadir nota...</span>}</span>
        ) : (
          <span className={field === 'order' ? 'w-full text-center font-medium text-gray-600' : 'text-gray-800'}>{value}</span>
        )}
      </div>
    );
  };

  const toggleProcessApplication = (processId: string, appId: string) => {
    setData(prev => ({
      ...prev,
      processes: prev.processes.map(p => {
        if (p.id !== processId) return p;
        const hasApp = (p.applicationIds || []).includes(appId);
        return {
          ...p,
          applicationIds: hasApp 
            ? (p.applicationIds || []).filter(id => id !== appId)
            : [...(p.applicationIds || []), appId]
        };
      })
    }));
  };

  const handleDeleteActivity = (id: string) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
      processes: prev.processes.filter(p => p.activityId !== id),
      opportunities: prev.opportunities.filter(o => !prev.processes.find(p => p.activityId === id && p.id === o.processId))
    }));
  };

  const handleDeleteProcess = (id: string) => {
    setData(prev => ({
      ...prev,
      processes: prev.processes.filter(p => p.id !== id),
      opportunities: prev.opportunities.filter(o => o.processId !== id)
    }));
  };

  const handleDeleteOpportunity = (id: string) => {
    setData(prev => ({
      ...prev,
      opportunities: prev.opportunities.filter(o => o.id !== id)
    }));
  };

  const moveActivity = (id: string, direction: 'up' | 'down') => {
    setData(prev => {
      const sorted = [...prev.activities].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(a => a.id === id);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return prev;
      
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const temp = sorted[idx];
      sorted[idx] = sorted[targetIdx];
      sorted[targetIdx] = temp;
      
      const newActivities = sorted.map((a, i) => ({ ...a, order: i + 1 }));
      return { ...prev, activities: newActivities };
    });
  };

  const moveProcess = (id: string, direction: 'up' | 'down') => {
    setData(prev => {
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
    });
  };

  const renderOrderCell = (type: 'activity' | 'process', id: string, order: number, index: number, maxIndex: number) => {
    const isEditing = editingCell?.id === id && editingCell?.field === `${type}-order`;
    
    return (
      <div className="flex items-center justify-between group px-1 min-w-[60px]">
        <div 
          className="flex-1 cursor-pointer hover:bg-indigo-50 rounded px-1 py-1 text-center" 
          onClick={() => startEdit(id, `${type}-order`, order)}
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
            onClick={() => type === 'activity' ? moveActivity(id, 'up') : moveProcess(id, 'up')} 
            disabled={index === 0} 
            className="text-gray-400 hover:text-indigo-600 disabled:opacity-20"
            title="Mover arriba"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button 
            onClick={() => type === 'activity' ? moveActivity(id, 'down') : moveProcess(id, 'down')} 
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

  const handleAddActivity = () => {
    const newId = crypto.randomUUID();
    const maxOrder = data.activities.reduce((max, a) => Math.max(max, a.order), 0);
    setData(prev => ({
      ...prev,
      activities: [...prev.activities, { id: newId, name: 'Nueva Actividad', order: maxOrder + 1 }]
    }));
    startEdit(newId, 'activity-name', 'Nueva Actividad');
  };

  const handleAddProcess = (activityId: string) => {
    const newId = crypto.randomUUID();
    const activityProcesses = data.processes.filter(p => p.activityId === activityId);
    const maxOrder = activityProcesses.reduce((max, p) => Math.max(max, p.order), 0);
    setData(prev => ({
      ...prev,
      processes: [...prev.processes, { id: newId, activityId, name: 'Nuevo Proceso', order: maxOrder + 1, applicationIds: [] }]
    }));
    startEdit(newId, 'process-name', 'Nuevo Proceso');
  };

  const handleAddOpportunity = (processId: string) => {
    const newId = crypto.randomUUID();
    setData(prev => ({
      ...prev,
      opportunities: [...prev.opportunities, { 
        id: newId, 
        processId, 
        name: 'Nueva Oportunidad', 
        priority: 3,
        impact: 3,
        difficulty: 3,
        status: 'Planificado',
        proposedBy: user?.displayName || user?.email || '',
        createdBy: user?.uid,
        notes: ''
      }]
    }));
    startEdit(newId, 'opportunity-name', 'Nueva Oportunidad');
  };

  const getProcessRowSpan = (processId: string) => {
    const opps = data.opportunities.filter(o => o.processId === processId);
    return Math.max(1, opps.length);
  };

  const getActivityRowSpan = (activityId: string) => {
    const processes = data.processes.filter(p => p.activityId === activityId);
    if (processes.length === 0) return 1;
    return processes.reduce((acc, p) => acc + getProcessRowSpan(p.id), 0);
  };

  const sortedActivities = [...data.activities].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
        <h3 className="font-semibold text-gray-800">Maestro de Procesos</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleAllActivities} 
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <ChevronsUpDown className="w-4 h-4" />
            {isAllCollapsed ? 'Expandir Actividades' : 'Colapsar Actividades'}
          </button>
          <button 
            onClick={() => setAppsCollapsed(!appsCollapsed)} 
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            {appsCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {appsCollapsed ? 'Expandir Aplicaciones' : 'Colapsar Aplicaciones'}
          </button>
          <button onClick={handleAddActivity} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            Añadir Actividad
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 z-30 shadow-sm">
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="p-3 border-b border-r border-gray-200 w-20 min-w-[80px] max-w-[80px] text-center font-semibold sticky left-0 bg-gray-100 z-40">Nº Act.</th>
              <th className="p-3 border-b border-r border-gray-200 w-64 min-w-[256px] max-w-[256px] font-semibold sticky left-[80px] bg-gray-100 z-40">Actividad</th>
              <th className="p-3 border-b border-r border-gray-200 w-20 min-w-[80px] text-center font-semibold bg-gray-100">Nº Proc.</th>
              <th className="p-3 border-b border-r border-gray-200 min-w-[200px] font-semibold bg-gray-100">Proceso</th>
              {appsCollapsed ? (
                <th className="p-3 border-b border-r border-gray-200 min-w-[150px] font-semibold bg-gray-100 text-center">
                  Aplicaciones
                </th>
              ) : (
                data.applications.map(app => (
                  <th key={app.id} className="p-3 border-b border-r border-gray-200 min-w-[100px] font-semibold bg-gray-100 text-center">
                    {app.name}
                  </th>
                ))
              )}
              <th className="p-3 border-b border-r border-gray-200 min-w-[250px] font-semibold bg-gray-100">Oportunidad</th>
              <th className="p-3 border-b border-r border-gray-200 w-24 min-w-[96px] text-center font-semibold bg-gray-100">Prioridad</th>
              <th className="p-3 border-b border-r border-gray-200 w-24 min-w-[96px] text-center font-semibold bg-gray-100">Impacto</th>
              <th className="p-3 border-b border-r border-gray-200 w-24 min-w-[96px] text-center font-semibold bg-gray-100">Dificultad</th>
              <th className="p-3 border-b border-r border-gray-200 w-36 min-w-[144px] text-center font-semibold bg-gray-100">Estado</th>
              <th className="p-3 border-b border-r border-gray-200 min-w-[150px] font-semibold bg-gray-100">Usuario</th>
              <th className="p-3 border-b w-48 min-w-[192px] font-semibold bg-gray-100">Notas</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sortedActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No hay datos. Carga un archivo Excel o añade una actividad manualmente.
                </td>
              </tr>
            ) : (
              sortedActivities.map((activity, aIndex) => {
                const activityProcesses = data.processes.filter(p => p.activityId === activity.id).sort((a, b) => a.order - b.order);
                const isCollapsed = collapsedActivities.has(activity.id);

                if (isCollapsed) {
                  const oppCount = activityProcesses.reduce((acc, p) => acc + data.opportunities.filter(o => o.processId === p.id).length, 0);
                  return (
                    <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-2 border-r border-gray-200 align-top bg-white sticky left-0 z-20">{renderOrderCell('activity', activity.id, activity.order, aIndex, sortedActivities.length - 1)}</td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white sticky left-[80px] z-20">
                        <div className="flex items-start gap-1">
                          <button onClick={() => toggleActivity(activity.id)} className="p-1 hover:bg-gray-100 rounded mt-0.5 shrink-0" title="Expandir">
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </button>
                          <div className="flex-1 flex flex-col gap-1">
                            {renderCell('activity', activity.id, 'name', activity.name)}
                            <div className="flex gap-3 px-2">
                              <button onClick={() => handleAddProcess(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"><Plus className="w-3 h-3"/> Proceso</button>
                              <button onClick={() => handleDeleteActivity(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> Eliminar</button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td colSpan={9 + (appsCollapsed ? 1 : data.applications.length)} className="p-3 text-sm text-gray-500 bg-gray-50/50 align-middle">
                        <span className="italic">{activityProcesses.length} procesos, {oppCount} oportunidades (Colapsado)</span>
                      </td>
                    </tr>
                  );
                }

                const actRowSpan = getActivityRowSpan(activity.id);

                if (activityProcesses.length === 0) {
                  return (
                    <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-2 border-r border-gray-200 align-top bg-white sticky left-0 z-20">{renderOrderCell('activity', activity.id, activity.order, aIndex, sortedActivities.length - 1)}</td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white sticky left-[80px] z-20">
                        <div className="flex items-start gap-1">
                          <button onClick={() => toggleActivity(activity.id)} className="p-1 hover:bg-gray-100 rounded mt-0.5 shrink-0" title="Colapsar">
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </button>
                          <div className="flex-1 flex flex-col gap-1">
                            {renderCell('activity', activity.id, 'name', activity.name)}
                            <div className="flex gap-3 px-2">
                              <button onClick={() => handleAddProcess(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"><Plus className="w-3 h-3"/> Proceso</button>
                              <button onClick={() => handleDeleteActivity(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> Eliminar</button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      {appsCollapsed ? (
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      ) : (
                        data.applications.map(app => (
                          <td key={app.id} className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        ))
                      )}
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                      <td className="p-2 text-center text-gray-300 bg-gray-50">-</td>
                    </tr>
                  );
                }

                return activityProcesses.map((process, pIndex) => {
                  const processOpportunities = data.opportunities.filter(o => o.processId === process.id);
                  const procRowSpan = getProcessRowSpan(process.id);

                  if (processOpportunities.length === 0) {
                    return (
                      <tr key={process.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        {pIndex === 0 && (
                          <>
                            <td rowSpan={actRowSpan} className="p-2 border-r border-gray-200 align-top bg-white sticky left-0 z-20">{renderOrderCell('activity', activity.id, activity.order, aIndex, sortedActivities.length - 1)}</td>
                            <td rowSpan={actRowSpan} className="p-2 border-r border-gray-200 align-top bg-white sticky left-[80px] z-20">
                              <div className="flex items-start gap-1">
                                <button onClick={() => toggleActivity(activity.id)} className="p-1 hover:bg-gray-100 rounded mt-0.5 shrink-0" title="Colapsar">
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>
                                <div className="flex-1 flex flex-col gap-1">
                                  {renderCell('activity', activity.id, 'name', activity.name)}
                                  <div className="flex gap-3 px-2">
                                    <button onClick={() => handleAddProcess(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"><Plus className="w-3 h-3"/> Proceso</button>
                                    <button onClick={() => handleDeleteActivity(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> Eliminar</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="p-2 border-r border-gray-200 align-top bg-white">{renderOrderCell('process', process.id, process.order, pIndex, activityProcesses.length - 1)}</td>
                        <td className="p-2 border-r border-gray-200 align-top bg-white">
                          <div className="flex flex-col gap-1">
                            {renderCell('process', process.id, 'name', process.name)}
                            <div className="flex gap-3 px-2">
                              <button onClick={() => handleAddOpportunity(process.id)} className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"><Plus className="w-3 h-3"/> Oportunidad</button>
                              <button onClick={() => handleDeleteProcess(process.id)} className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> Eliminar</button>
                            </div>
                          </div>
                        </td>
                        {appsCollapsed ? (
                          <td className="p-2 border-r border-gray-200 align-middle bg-white text-sm text-gray-600 px-3 text-center">
                            {(process.applicationIds || []).map(id => data.applications.find(a => a.id === id)?.name).filter(Boolean).join(', ') || '-'}
                          </td>
                        ) : (
                          data.applications.map(app => {
                            const hasApp = (process.applicationIds || []).includes(app.id);
                            return (
                              <td key={app.id} className="p-2 border-r border-gray-200 align-middle bg-white text-center cursor-pointer hover:bg-gray-50" onClick={() => toggleProcessApplication(process.id, app.id)}>
                                <div className="flex justify-center">
                                  <input type="checkbox" checked={hasApp} readOnly className="w-4 h-4 text-indigo-600 rounded border-gray-300 pointer-events-none" />
                                </div>
                              </td>
                            );
                          })
                        )}
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        <td className="p-2 border-r border-gray-200 text-center text-gray-300 bg-gray-50">-</td>
                        <td className="p-2 text-center text-gray-300 bg-gray-50">-</td>
                      </tr>
                    );
                  }

                  return processOpportunities.map((opp, oIndex) => (
                    <tr key={opp.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      {pIndex === 0 && oIndex === 0 && (
                        <>
                          <td rowSpan={actRowSpan} className="p-2 border-r border-gray-200 align-top bg-white sticky left-0 z-20">{renderOrderCell('activity', activity.id, activity.order, aIndex, sortedActivities.length - 1)}</td>
                          <td rowSpan={actRowSpan} className="p-2 border-r border-gray-200 align-top bg-white sticky left-[80px] z-20">
                            <div className="flex items-start gap-1">
                              <button onClick={() => toggleActivity(activity.id)} className="p-1 hover:bg-gray-100 rounded mt-0.5 shrink-0" title="Colapsar">
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </button>
                              <div className="flex-1 flex flex-col gap-1">
                                {renderCell('activity', activity.id, 'name', activity.name)}
                                <div className="flex gap-3 px-2">
                                  <button onClick={() => handleAddProcess(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"><Plus className="w-3 h-3"/> Proceso</button>
                                  <button onClick={() => handleDeleteActivity(activity.id)} className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> Eliminar</button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </>
                      )}
                      {oIndex === 0 && (
                        <>
                          <td rowSpan={procRowSpan} className="p-2 border-r border-gray-200 align-top bg-white">{renderOrderCell('process', process.id, process.order, pIndex, activityProcesses.length - 1)}</td>
                          <td rowSpan={procRowSpan} className="p-2 border-r border-gray-200 align-top bg-white">
                            <div className="flex flex-col gap-1">
                              {renderCell('process', process.id, 'name', process.name)}
                              <div className="flex gap-3 px-2">
                                <button onClick={() => handleAddOpportunity(process.id)} className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"><Plus className="w-3 h-3"/> Oportunidad</button>
                                <button onClick={() => handleDeleteProcess(process.id)} className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> Eliminar</button>
                              </div>
                            </div>
                          </td>
                          {appsCollapsed ? (
                            <td rowSpan={procRowSpan} className="p-2 border-r border-gray-200 align-middle bg-white text-sm text-gray-600 px-3 text-center">
                              {(process.applicationIds || []).map(id => data.applications.find(a => a.id === id)?.name).filter(Boolean).join(', ') || '-'}
                            </td>
                          ) : (
                            data.applications.map(app => {
                              const hasApp = (process.applicationIds || []).includes(app.id);
                              return (
                                <td key={app.id} rowSpan={procRowSpan} className="p-2 border-r border-gray-200 align-middle bg-white text-center cursor-pointer hover:bg-gray-50" onClick={() => toggleProcessApplication(process.id, app.id)}>
                                  <div className="flex justify-center">
                                    <input type="checkbox" checked={hasApp} readOnly className="w-4 h-4 text-indigo-600 rounded border-gray-300 pointer-events-none" />
                                  </div>
                                </td>
                              );
                            })
                          )}
                        </>
                      )}
                      <td className="p-2 border-r border-gray-200 align-top bg-white">
                        <div className="flex justify-between items-start group">
                          <button onClick={() => setSelectedOpportunity(opp)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors mt-0.5" title="Ver detalles">
                            <Maximize2 className="w-4 h-4"/>
                          </button>
                          <div className="flex-1">{renderCell('opportunity', opp.id, 'name', opp.name)}</div>
                          <button onClick={() => handleDeleteOpportunity(opp.id)} className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-0.5" title="Eliminar Oportunidad"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white text-center">{renderCell('opportunity', opp.id, 'priority', opp.priority)}</td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white text-center">{renderCell('opportunity', opp.id, 'impact', opp.impact)}</td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white text-center">{renderCell('opportunity', opp.id, 'difficulty', opp.difficulty)}</td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white text-center">{renderCell('opportunity', opp.id, 'status', opp.status)}</td>
                      <td className="p-2 border-r border-gray-200 align-top bg-white">{renderCell('opportunity', opp.id, 'proposedBy', opp.proposedBy || '')}</td>
                      <td className="p-2 align-top bg-white">{renderCell('opportunity', opp.id, 'notes', opp.notes || '')}</td>
                    </tr>
                  ));
                });
              })
            )}
          </tbody>
        </table>
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

