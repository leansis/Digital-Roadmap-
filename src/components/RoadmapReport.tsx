import React, { useRef } from 'react';
import { AppData } from '../types';
import { ImpactDifficultyMatrix } from './ImpactDifficultyMatrix';
import { Printer } from 'lucide-react';

interface RoadmapReportProps {
  data: AppData;
  companyName: string;
}

export const RoadmapReport: React.FC<RoadmapReportProps> = ({ data, companyName }) => {
  const getProcessName = (processId: string) => {
    return data.processes.find(p => p.id === processId)?.name || 'Proceso Desconocido';
  };

  const getActivityName = (processId: string) => {
    const process = data.processes.find(p => p.id === processId);
    if (!process) return 'Actividad Desconocida';
    return data.activities.find(a => a.id === process.activityId)?.name || 'Actividad Desconocida';
  };

  const sortedOpportunities = [...data.opportunities].sort((a, b) => b.priority - a.priority);

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      alert("La impresión está bloqueada en esta vista previa. Pulsa Ctrl+P (o Cmd+P) en tu teclado, o abre la app en una nueva pestaña.");
    }
  };

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informe Roadmap</h2>
          <p className="text-sm text-gray-500 mt-1">
            Vista lista para impresión o exportación a PDF del Roadmap Digital
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Exportar a PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-gray-50 print:bg-white report-container">
        <div className="max-w-[1200px] mx-auto bg-white print:shadow-none print:border-none shadow-sm border border-gray-200 rounded-xl">
          
          {/* Print Template Container */}
          <div className="p-8 print:p-0">
            {/* Report Header for Print */}
            <div className="hidden print:block mb-8 border-b-2 border-indigo-600 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Roadmap Digital</h1>
              <div className="flex justify-between items-end mt-4 text-gray-600">
                <p className="text-lg font-semibold">{companyName}</p>
                <p className="text-sm">Fecha: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Matrix Section (Page 1) */}
            <div className="mb-12 print:mb-0 print:break-inside-avoid print:page-break-after-always">
              <div className="h-[650px] w-full print:h-[950px] relative">
                <ImpactDifficultyMatrix data={data} isPrintMode={true} />
              </div>
            </div>

            {/* List Section (Page 2+) */}
            <div className="print:mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Listado de Iniciativas
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Prioridad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Iniciativa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actividad / Proceso</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Impacto / Dificultad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOpportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-gray-50 break-inside-avoid">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                          {opp.priority}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs truncate">
                          {opp.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          <span className="block text-xs font-bold text-gray-700">{getActivityName(opp.processId)}</span>
                          <span className="block text-xs">{getProcessName(opp.processId)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs"><strong className="text-indigo-600">I:</strong> {opp.impact}</span>
                            <span className="text-xs"><strong className="text-indigo-600">D:</strong> {opp.difficulty}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            opp.status === 'Finalizada' ? 'bg-emerald-100 text-emerald-800 border- emerald-200' :
                            opp.status === 'En curso' ? 'bg-blue-100 text-blue-800' :
                            opp.status === 'Planificado' ? 'bg-amber-100 text-amber-800' :
                            opp.status === 'Propuesta' ? 'bg-indigo-100 text-indigo-800' :
                            opp.status === 'No priorizado' ? 'bg-slate-100 text-slate-800' :
                            opp.status === 'Tests' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {opp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sortedOpportunities.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          No hay iniciativas registradas en el Roadmap.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background-color: white !important;
          }
          .report-container {
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
          }
          .print-break-after {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};
