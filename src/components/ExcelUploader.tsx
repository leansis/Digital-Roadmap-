import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';
import { AppData, Activity, Process, Opportunity, Application, OpportunityStatus } from '../types';

interface ExcelUploaderProps {
  onDataLoaded: (data: AppData) => void;
  variant?: 'full' | 'button';
}

export function ExcelUploader({ onDataLoaded, variant = 'full' }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const activities: Activity[] = [];
      const processes: Process[] = [];
      const opportunities: Opportunity[] = [];
      const applications: Application[] = [];

      let actOrderCounter = 1;
      let procOrderCounter = 1;

      let currentActivityName = '';
      let currentProcessName = '';

      data.forEach((row: any) => {
        const rawActName = row['Actividad'] || row['actividad'] || row['ACTIVIDAD'];
        const rawProcName = row['Proceso'] || row['proceso'] || row['PROCESO'];
        const rawOppName = row['Oportunidad'] || row['oportunidad'] || row['OPORTUNIDAD'];
        const rawAppName = row['Aplicación'] || row['aplicación'] || row['APLICACIÓN'] || row['Aplicaciones'] || row['aplicaciones'] || row['APLICACIONES'];
        const priority = parseInt(row['Prioridad'] || row['prioridad'] || row['PRIORIDAD']) || 3;
        const impact = parseInt(row['Impacto'] || row['impacto'] || row['IMPACTO']) || 3;
        const difficulty = parseInt(row['Dificultad'] || row['dificultad'] || row['DIFICULTAD']) || 3;
        const rawStatus = row['Estado'] || row['estado'] || row['ESTADO'];
        const rawNotes = row['Notas'] || row['notas'] || row['NOTAS'];
        
        let status: OpportunityStatus = 'Planificado';
        if (rawStatus) {
          const s = String(rawStatus).trim().toLowerCase();
          if (s === 'en curso') status = 'En curso';
          else if (s === 'finalizada') status = 'Finalizada';
          else if (s === 'no priorizado') status = 'No priorizado';
          else if (s === 'tests') status = 'Tests';
        }

        const rawActOrder = row['n actividad'] ?? row['N actividad'] ?? row['N ACTIVIDAD'] ?? row['n activida'] ?? row['N activida'];
        const rawProcOrder = row['n proceso'] ?? row['N proceso'] ?? row['N PROCESO'] ?? row['n proces'] ?? row['N proces'];

        if (rawActName) {
          currentActivityName = String(rawActName).trim();
          currentProcessName = ''; // Reset process when a new activity starts
        }
        
        if (rawProcName) {
          currentProcessName = String(rawProcName).trim();
        }

        if (!currentActivityName) return;

        let activity = activities.find(a => a.name === currentActivityName);
        if (!activity) {
          const order = rawActOrder !== undefined ? parseInt(rawActOrder) : actOrderCounter++;
          activity = { id: crypto.randomUUID(), name: currentActivityName, order };
          activities.push(activity);
        }

        if (currentProcessName) {
          let process = processes.find(p => p.name === currentProcessName && p.activityId === activity!.id);
          
          const appNames = rawAppName ? String(rawAppName).split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];
          const appIds = appNames.map(name => {
            let app = applications.find(a => a.name.toLowerCase() === name.toLowerCase());
            if (!app) {
              app = { id: crypto.randomUUID(), name };
              applications.push(app);
            }
            return app.id;
          });

          if (!process) {
            const order = rawProcOrder !== undefined ? parseInt(rawProcOrder) : procOrderCounter++;
            process = { id: crypto.randomUUID(), activityId: activity!.id, name: currentProcessName, order, applicationIds: appIds };
            processes.push(process);
          } else {
            const newAppIds = Array.from(new Set([...process.applicationIds, ...appIds]));
            process.applicationIds = newAppIds;
          }

          if (rawOppName) {
            opportunities.push({
              id: crypto.randomUUID(),
              processId: process.id,
              name: String(rawOppName).trim(),
              priority: Math.min(Math.max(priority, 1), 5),
              impact: Math.min(Math.max(impact, 1), 5),
              difficulty: Math.min(Math.max(difficulty, 1), 5),
              status,
              proposedBy: 'Importado',
              notes: rawNotes ? String(rawNotes).trim() : ''
            });
          }
        }
      });

      onDataLoaded({ activities, processes, opportunities, applications });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  if (variant === 'button') {
    return (
      <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200">
        <Upload className="w-4 h-4" />
        Recargar Excel
        <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </label>
    );
  }

  return (
    <div className="flex items-center justify-center w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-indigo-500" />
          <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Haz clic para cargar</span> o arrastra y suelta</p>
          <p className="text-xs text-gray-500">Excel con columnas: n actividad, Actividad, n proceso, Proceso, Aplicación, Oportunidad, Prioridad</p>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </label>
    </div>
  );
}
