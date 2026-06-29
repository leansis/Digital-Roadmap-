import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, User as UserIcon, Plus, X } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AppUser {
  id: string; // The email for admins that haven't logged in, or UID for logged-in users
  email: string;
  displayName?: string;
  updatedAt?: string;
  isAdmin: boolean;
  isRegistered: boolean;
}

interface UserManagementProps {
  currentUserEmail?: string | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUserEmail }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  useEffect(() => {
    // We need to fetch both users and admins collections to determine who is an admin
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || 'Sin correo',
        displayName: doc.data().displayName,
        updatedAt: doc.data().updatedAt,
        isAdmin: false, // Default, will merge with admins
        isRegistered: true
      }));

      const unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (adminsSnapshot) => {
        const adminEmails = new Set(adminsSnapshot.docs.map(doc => doc.id.toLowerCase()));
        
        // Find admins that are not in the users list yet (invited by email)
        const userEmails = new Set(usersList.map(u => u.email.toLowerCase()));
        
        const pendingAdmins: AppUser[] = [];
        adminsSnapshot.docs.forEach(adminDoc => {
          const email = adminDoc.id.toLowerCase();
          if (!userEmails.has(email)) {
            pendingAdmins.push({
              id: email,
              email: email,
              displayName: 'Usuario pendiente (No ha accedido)',
              isAdmin: true,
              isRegistered: false
            });
          }
        });

        // Merge
        const mergedUsers = usersList.map(u => ({
          ...u,
          // global admin email always true
          isAdmin: u.email.toLowerCase() === 'leansisproductivity@gmail.com' || adminEmails.has(u.email.toLowerCase())
        }));
        
        const allUsers = [...mergedUsers, ...pendingAdmins];

        // Sort by email
        allUsers.sort((a, b) => a.email.localeCompare(b.email));
        setUsers(allUsers);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admins');
        setLoading(false);
      });

      return () => unsubscribeAdmins();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribeUsers();
  }, []);

  const toggleAdmin = async (currentIsAdmin: boolean, email: string) => {
    const emailLower = email.toLowerCase();
    if (emailLower === 'leansisproductivity@gmail.com') {
      alert('No se puede quitar el permiso de administrador al usuario principal.');
      return;
    }

    try {
      if (currentIsAdmin) {
        await deleteDoc(doc(db, 'admins', emailLower));
      } else {
        await setDoc(doc(db, 'admins', emailLower), {
          grantedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${emailLower}`);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    const emailLower = newAdminEmail.trim().toLowerCase();
    try {
      await setDoc(doc(db, 'admins', emailLower), {
        grantedAt: new Date().toISOString()
      });
      setNewAdminEmail('');
      setIsAddingAdmin(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${emailLower}`);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-500 mt-1">Administra el acceso y los permisos de los usuarios de la aplicación.</p>
        </div>
        
        {isAddingAdmin ? (
          <form onSubmit={handleAddAdmin} className="flex items-center gap-2">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Email del nuevo admin"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingAdmin(false);
                setNewAdminEmail('');
              }}
              className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingAdmin(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir Administrador
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Último acceso</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                          {!user.isRegistered && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pendiente de registro
                            </span>
                          )}
                        </div>
                        {user.displayName && (
                          <div className="text-sm text-gray-500">{user.displayName}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5" title={user.id}>
                          {user.isRegistered ? `ID: ${user.id.substring(0,8)}...` : 'Sin ID'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleAdmin(user.isAdmin, user.email)}
                      disabled={user.email.toLowerCase() === 'leansisproductivity@gmail.com'}
                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        user.isAdmin 
                          ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
                          : 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500'
                      }`}
                    >
                      {user.isAdmin ? 'Quitar Admin' : 'Hacer Admin'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};
