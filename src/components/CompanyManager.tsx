import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Building2, Plus, LogOut, Trash2, LayoutTemplate, Edit2, Check, X, Share2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  updatedAt?: string;
}

interface CompanyManagerProps {
  user: User;
  onSelect: (id: string, shared?: boolean) => void;
  onLogout: () => void;
}

export const CompanyManager: React.FC<CompanyManagerProps> = ({ user, onSelect, onLogout }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sharedCompanies, setSharedCompanies] = useState<Company[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSharing, setIsSharing] = useState<string | null>(null);

  const userEmailLower = user.email?.toLowerCase();
  const isSGSUser = userEmailLower?.endsWith('@sgs.com');
  const isAdmin = userEmailLower === 'leansisproductivity@gmail.com';

  useEffect(() => {
    // Listen to personal companies
    const q = collection(db, 'users', user.uid, 'companies');
    const unsubscribePersonal = onSnapshot(q, (snapshot) => {
      const comps: Company[] = [];
      snapshot.forEach(doc => {
        comps.push({ id: doc.id, name: doc.data().name, updatedAt: doc.data().updatedAt });
      });
      comps.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setCompanies(comps);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/companies`);
      setLoading(false);
    });

    // Listen to shared companies if SGS user or Admin
    let unsubscribeShared: (() => void) | undefined;
    if (isSGSUser || isAdmin) {
      const sharedQ = collection(db, 'shared_companies');
      unsubscribeShared = onSnapshot(sharedQ, (snapshot) => {
        const comps: Company[] = [];
        snapshot.forEach(doc => {
          comps.push({ id: doc.id, name: doc.data().name, updatedAt: doc.data().updatedAt });
        });
        setSharedCompanies(comps);
      }, (error) => {
        console.error("Error loading shared companies:", error);
      });
    }

    return () => {
      unsubscribePersonal();
      if (unsubscribeShared) unsubscribeShared();
    };
  }, [user, isSGSUser, isAdmin]);

  // Filter out personal companies that are already shown in shared
  const personalCompanies = companies.filter(c => !sharedCompanies.some(sc => sc.id === c.id));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setIsCreating(true);
    try {
      const newDoc = await addDoc(collection(db, 'users', user.uid, 'companies'), {
        name: newCompanyName.trim(),
        activities: [],
        processes: [],
        opportunities: [],
        applications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewCompanyName('');
      onSelect(newDoc.id); // Auto-select newly created company
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/companies`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    // Use a custom confirmation logic if needed, but for now we'll use a simple state-based or just rely on the user.
    // Since we can't use window.confirm, we'll implement a quick inline confirm or just delete.
    // To be safe, let's just delete for this prototype, or we could add a "confirmDeleteId" state.
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'companies', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/companies/${id}`);
    }
  };

  const handleUpdate = async (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'companies', id), {
        name: editingName.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/companies/${id}`);
    }
  };

  const startEditing = (e: React.MouseEvent, company: Company) => {
    e.stopPropagation();
    setEditingId(company.id);
    setEditingName(company.name);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleShare = async (e: React.MouseEvent, company: Company) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setIsSharing(company.id);
    try {
      const docRef = doc(db, 'users', user.uid, 'companies', company.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const companyData = docSnap.data();
        await setDoc(doc(db, 'shared_companies', company.id), {
          ...companyData,
          isShared: true,
          sharedAt: new Date().toISOString(),
          sharedBy: user.email
        });
        alert(`Empresa "${company.name}" compartida con éxito.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shared_companies/${company.id}`);
    } finally {
      setIsSharing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <LayoutTemplate className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Digital Roadmap</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Mis Empresas</h2>
          <p className="text-gray-500 mt-1">Selecciona una empresa para gestionar su roadmap digital o crea una nueva.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Shared Companies Section (Visible to SGS and Admins) */}
          {(isSGSUser || isAdmin) && sharedCompanies.map(company => (
            <div 
              key={company.id}
              onClick={() => onSelect(company.id, true)}
              className="bg-indigo-600 rounded-xl border border-indigo-500 p-6 shadow-md hover:shadow-lg hover:bg-indigo-700 cursor-pointer transition-all flex flex-col relative group text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 text-white rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">
                  {isAdmin ? 'Empresa Global (SGS)' : 'Compartida (SGS)'}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1 truncate" title={company.name}>
                {company.name}
              </h3>
              <p className="text-sm text-indigo-100 mt-auto pt-4">
                {isAdmin ? 'Acceso de administrador global' : 'Acceso corporativo para @sgs.com'}
              </p>
            </div>
          ))}

          {/* Create New Company Card */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col justify-center items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors group">
            <form onSubmit={handleCreate} className="w-full flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nueva Empresa</h3>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Nombre de la empresa"
                className="w-full text-center px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                required
              />
              <button
                type="submit"
                disabled={isCreating || !newCompanyName.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creando...' : 'Crear Empresa'}
              </button>
            </form>
          </div>

          {/* Personal Company Cards */}
          {personalCompanies.map(company => (
            <div 
              key={company.id}
              onClick={() => onSelect(company.id)}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all flex flex-col relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 transition-all ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleShare(e, company)}
                      disabled={isSharing === company.id}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 flex items-center gap-1"
                      title="Compartir con SGS"
                    >
                      <Share2 className={`w-4 h-4 ${isSharing === company.id ? 'animate-pulse' : ''}`} />
                      <span className="text-[10px] font-bold uppercase">Compartir</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => startEditing(e, company)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Editar nombre"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, company.id, company.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar empresa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {editingId === company.id ? (
                <div className="mb-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(e, company.id)}
                  />
                  <button
                    onClick={(e) => handleUpdate(e, company.id)}
                    className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h3 className="text-xl font-bold text-gray-900 mb-1 truncate" title={company.name}>
                  {company.name}
                </h3>
              )}
              <p className="text-sm text-gray-500 mt-auto pt-4">
                Última actualización: {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
