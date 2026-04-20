import React, { useState, useEffect, useRef } from 'react';
import { AppData } from './types';
import { ExcelUploader } from './components/ExcelUploader';
import { EditableTable } from './components/EditableTable';
import { ChevronDiagram } from './components/ChevronDiagram';
import { MasterData } from './components/MasterData';
import { ImpactDifficultyMatrix } from './components/ImpactDifficultyMatrix';
import { OpportunityList } from './components/OpportunityList';
import { Auth } from './components/Auth';
import { CompanyManager } from './components/CompanyManager';
import { LayoutTemplate, TableProperties, Download, Database, Grid, LogOut, Building2, ArrowLeft, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

export default function App() {
  const [data, setData] = useState<AppData>({
    activities: [],
    processes: [],
    opportunities: [],
    applications: []
  });

  const [activeTab, setActiveTab] = useState<'diagram' | 'table' | 'matrix' | 'master' | 'list'>('diagram');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isSharedCompany, setIsSharedCompany] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, '_connection_test_', 'test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user || !selectedCompanyId) {
      setData({ activities: [], processes: [], opportunities: [], applications: [] });
      return;
    }

    const docRef = isSharedCompany 
      ? doc(db, 'shared_companies', selectedCompanyId)
      : doc(db, 'users', user.uid, 'companies', selectedCompanyId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const serverData = docSnap.data() as AppData & { name: string };
        isRemoteUpdate.current = true;
        setData({
          activities: serverData.activities || [],
          processes: serverData.processes || [],
          opportunities: serverData.opportunities || [],
          applications: serverData.applications || []
        });
        setCompanyName(serverData.name || '');
      }
    }, (error) => {
      const path = isSharedCompany 
        ? `shared_companies/${selectedCompanyId}`
        : `users/${user.uid}/companies/${selectedCompanyId}`;
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [user, authReady, selectedCompanyId, isSharedCompany]);

  useEffect(() => {
    if (!user || !authReady || !selectedCompanyId) return;
    
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const saveData = async () => {
      try {
        const docRef = isSharedCompany 
          ? doc(db, 'shared_companies', selectedCompanyId)
          : doc(db, 'users', user.uid, 'companies', selectedCompanyId);
        await setDoc(docRef, { ...data, name: companyName, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (error) {
        const path = isSharedCompany 
          ? `shared_companies/${selectedCompanyId}`
          : `users/${user.uid}/companies/${selectedCompanyId}`;
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    };
    
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [data, user, authReady, selectedCompanyId, isSharedCompany, companyName]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSelectCompany = (id: string, shared: boolean = false) => {
    setIsSharedCompany(shared);
    setSelectedCompanyId(id);
  };

  const handleDataLoaded = (newData: AppData) => {
    setData(newData);
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
        createdBy: user?.uid
      }]
    }));
    setActiveTab('table');
  };

  const handleDeleteOpportunity = (id: string) => {
    setData(prev => ({
      ...prev,
      opportunities: prev.opportunities.filter(o => o.id !== id)
    }));
  };

  const exportToExcel = () => {
    const exportData: any[] = [];
    const sortedActivities = [...data.activities].sort((a, b) => a.order - b.order);
    
    sortedActivities.forEach(activity => {
      const activityProcesses = data.processes.filter(p => p.activityId === activity.id).sort((a, b) => a.order - b.order);
      
      if (activityProcesses.length === 0) {
        exportData.push({
          'n actividad': activity.order,
          'Actividad': activity.name,
          'n proceso': '',
          'Proceso': '',
          'Aplicación': '',
          'Oportunidad': '',
          'Prioridad': '',
          'Impacto': '',
          'Dificultad': '',
          'Estado': '',
          'Notas': ''
        });
        return;
      }
      
      activityProcesses.forEach(process => {
        const processOpportunities = data.opportunities.filter(o => o.processId === process.id);
        const processApps = process.applicationIds.map(id => data.applications.find(a => a.id === id)?.name).filter(Boolean).join(', ');
        
        if (processOpportunities.length === 0) {
          exportData.push({
            'n actividad': activity.order,
            'Actividad': activity.name,
            'n proceso': process.order,
            'Proceso': process.name,
            'Aplicación': processApps,
            'Oportunidad': '',
            'Prioridad': '',
            'Impacto': '',
            'Dificultad': '',
            'Estado': '',
            'Notas': ''
          });
          return;
        }
        
        processOpportunities.forEach(opp => {
          exportData.push({
            'n actividad': activity.order,
            'Actividad': activity.name,
            'n proceso': process.order,
            'Proceso': process.name,
            'Aplicación': processApps,
            'Oportunidad': opp.name,
            'Prioridad': opp.priority,
            'Impacto': opp.impact,
            'Dificultad': opp.difficulty,
            'Estado': opp.status,
            'Notas': opp.notes || ''
          });
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, "procesos_oportunidades.xlsx");
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!selectedCompanyId) {
    return <CompanyManager user={user} onSelect={handleSelectCompany} onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20">
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <button 
            onClick={() => setSelectedCompanyId(null)}
            className="mr-2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver a Empresas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-indigo-600 p-1.5 rounded-lg mr-2 shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900 leading-tight truncate" title={companyName}>
            {companyName || 'Cargando...'}
          </h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`flex items-center justify-start w-full text-left gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'diagram' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutTemplate className="w-5 h-5 shrink-0" />
            Diagrama
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center justify-start w-full text-left gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'table' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <TableProperties className="w-5 h-5 shrink-0" />
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center justify-start w-full text-left gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'matrix' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Grid className="w-5 h-5 shrink-0" />
            Matriz Impacto/Dificultad
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center justify-start w-full text-left gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            Listado Oportunidades
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center justify-start w-full text-left gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'master' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Database className="w-5 h-5 shrink-0" />
            Datos Maestros
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center justify-start w-full text-left gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm shrink-0 h-16 flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            {data.activities.length > 0 && (
              <div className="flex items-center gap-2">
                <ExcelUploader onDataLoaded={handleDataLoaded} variant="button" />
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                  title="Descargar Excel"
                >
                  <Download className="w-4 h-4" />
                  Descargar Excel
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden p-6">
          {data.activities.length === 0 && activeTab !== 'master' && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto mt-10">
              <h2 className="text-lg font-semibold mb-4">Cargar Datos</h2>
              <ExcelUploader onDataLoaded={handleDataLoaded} />
            </section>
          )}

          {(data.activities.length > 0 || activeTab === 'master') && (
            <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              {activeTab === 'diagram' && (
                <ChevronDiagram 
                  data={data} 
                  onAddOpportunity={handleAddOpportunity} 
                  onDeleteOpportunity={handleDeleteOpportunity}
                  user={user}
                />
              )}
              {activeTab === 'table' && (
                <EditableTable data={data} setData={setData} user={user} />
              )}
              {activeTab === 'matrix' && (
                <ImpactDifficultyMatrix data={data} />
              )}
              {activeTab === 'list' && (
                <OpportunityList data={data} />
              )}
              {activeTab === 'master' && (
                <MasterData data={data} setData={setData} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
