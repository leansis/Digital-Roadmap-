import React, { useState, useMemo } from 'react';
import { AppData, Opportunity, OpportunityStatus } from '../types';
import { ClipboardList, Search, Filter, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface OpportunityListProps {
  data: AppData;
}

type SortField = 'name' | 'status' | 'activity' | 'process' | 'proposedBy' | 'priority' | 'impact' | 'difficulty';
type SortDirection = 'asc' | 'desc';

export const OpportunityList: React.FC<OpportunityListProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'Todos'>('Todos');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getProcessName = (processId: string) => {
    return data.processes.find(p => p.id === processId)?.name || 'N/A';
  };

  const getActivityName = (processId: string) => {
    const process = data.processes.find(p => p.id === processId);
    if (!process) return 'N/A';
    return data.activities.find(a => a.id === process.activityId)?.name || 'N/A';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const rankedOpportunities = useMemo(() => {
    return [...data.opportunities].sort((a, b) => b.priority - a.priority);
  }, [data.opportunities]);

  const getRank = (oppId: string) => {
    return rankedOpportunities.findIndex(o => o.id === oppId) + 1;
  };

  const filteredAndSortedOpportunities = useMemo(() => {
    let result = [...data.opportunities];

    // Filtering
    if (statusFilter !== 'Todos') {
      result = result.filter(opp => opp.status === statusFilter);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(opp => 
        opp.name.toLowerCase().includes(lowerSearch) ||
        (opp.proposedBy || '').toLowerCase().includes(lowerSearch) ||
        (opp.notes || '').toLowerCase().includes(lowerSearch) ||
        getProcessName(opp.processId).toLowerCase().includes(lowerSearch) ||
        getActivityName(opp.processId).toLowerCase().includes(lowerSearch)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'status': valA = a.status; valB = b.status; break;
        case 'activity': valA = getActivityName(a.processId); valB = getActivityName(b.processId); break;
        case 'process': valA = getProcessName(a.processId); valB = getProcessName(b.processId); break;
        case 'proposedBy': valA = a.proposedBy || ''; valB = b.proposedBy || ''; break;
        case 'priority': valA = a.priority; valB = b.priority; break;
        case 'impact': valA = a.impact; valB = b.impact; break;
        case 'difficulty': valA = a.difficulty; valB = b.difficulty; break;
        default: valA = 0; valB = 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data.opportunities, searchTerm, statusFilter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Listado de Oportunidades</h2>
            </div>
            <p className="text-sm text-gray-500">
              Resumen detallado de todas las iniciativas y oportunidades identificadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Planificado">Planificado</option>
                <option value="En curso">En curso</option>
                <option value="Finalizada">Finalizada</option>
                <option value="No priorizado">No priorizado</option>
                <option value="Tests">Tests</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">Oportunidad <SortIcon field="name" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">Estado <SortIcon field="status" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('activity')}
              >
                <div className="flex items-center">Actividad <SortIcon field="activity" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('process')}
              >
                <div className="flex items-center">Proceso <SortIcon field="process" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('proposedBy')}
              >
                <div className="flex items-center">Usuario <SortIcon field="proposedBy" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center justify-center">Prioridad <SortIcon field="priority" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('impact')}
              >
                <div className="flex items-center justify-center">Impacto <SortIcon field="impact" /></div>
              </th>
              <th 
                className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('difficulty')}
              >
                <div className="flex items-center justify-center">Dificultad <SortIcon field="difficulty" /></div>
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAndSortedOpportunities.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-gray-400 italic">
                  {searchTerm || statusFilter !== 'Todos' ? 'No se encontraron oportunidades con los filtros aplicados.' : 'No hay oportunidades registradas.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedOpportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-indigo-50/40 even:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{opp.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      opp.status === 'Finalizada' ? 'bg-emerald-100 text-emerald-800' :
                      opp.status === 'En curso' ? 'bg-blue-100 text-blue-800' :
                      opp.status === 'Planificado' ? 'bg-amber-100 text-amber-800' :
                      opp.status === 'No priorizado' ? 'bg-slate-100 text-slate-800' :
                      opp.status === 'Tests' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getActivityName(opp.processId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getProcessName(opp.processId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{opp.proposedBy || '-'}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold">
                        {getRank(opp.id)}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        opp.priority >= 4 ? 'bg-red-50 text-red-700' : 
                        opp.priority >= 3 ? 'bg-amber-50 text-amber-700' : 
                        'bg-blue-50 text-blue-700'
                      }`}>
                        Score: {opp.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-semibold text-indigo-600">{opp.impact}</td>
                  <td className="px-6 py-4 text-sm text-center font-semibold text-indigo-600">{opp.difficulty}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={opp.notes}>
                    {opp.notes || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
