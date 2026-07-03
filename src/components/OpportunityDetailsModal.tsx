import React, { useState } from 'react';
import { Opportunity, OpportunityStatus } from '../types';
import { X, Save } from 'lucide-react';

interface OpportunityDetailsModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSave: (updatedOpportunity: Opportunity) => void;
}

export const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({ opportunity, onClose, onSave }) => {
  const [formData, setFormData] = useState<Opportunity>(opportunity);

  const handleChange = (field: keyof Opportunity, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (field: keyof NonNullable<Opportunity['informationCategories']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      informationCategories: {
        ...(prev.informationCategories || {
          datosPersonales: false,
          datosSensibles: false,
          datosPenales: false,
          datosFinancieros: false,
          datosInternos: false,
          datosConfidenciales: false,
          propiedadIntelectual: false
        }),
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Detalles de la Oportunidad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Iniciativa</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value as OpportunityStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Planificado">Planificado</option>
                  <option value="En curso">En curso</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="No priorizado">No priorizado</option>
                  <option value="Tests">Tests</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad (1-5)</label>
                <select
                  value={formData.priority}
                  onChange={e => handleChange('priority', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impacto (1-5)</label>
                <select
                  value={formData.impact}
                  onChange={e => handleChange('impact', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad (1-5)</label>
                <select
                  value={formData.difficulty}
                  onChange={e => handleChange('difficulty', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario propuesto por</label>
                <input
                  type="text"
                  value={formData.proposedBy || ''}
                  onChange={e => handleChange('proposedBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={formData.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Categorías de Información</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.informationCategories?.datosPersonales || false}
                    onChange={e => handleCategoryChange('datosPersonales', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Datos personales</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.informationCategories?.datosSensibles || false}
                    onChange={e => handleCategoryChange('datosSensibles', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Datos sensibles (salud, etc.)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.informationCategories?.datosPenales || false}
                    onChange={e => handleCategoryChange('datosPenales', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Datos penales</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.informationCategories?.datosFinancieros || false}
                    onChange={e => handleCategoryChange('datosFinancieros', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Datos financieros</span>
                </label>

                <div className="pl-6 space-y-2 border-l-2 border-gray-100 ml-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.informationCategories?.datosInternos || false}
                      onChange={e => handleCategoryChange('datosInternos', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Datos internos</span>
                  </label>
                  {formData.informationCategories?.datosInternos && (
                    <input
                      type="text"
                      placeholder="Especificar..."
                      value={formData.informationCategories?.datosInternosEspecificar || ''}
                      onChange={e => handleCategoryChange('datosInternosEspecificar', e.target.value)}
                      className="w-full ml-6 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                </div>

                <div className="pl-6 space-y-2 border-l-2 border-gray-100 ml-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.informationCategories?.datosConfidenciales || false}
                      onChange={e => handleCategoryChange('datosConfidenciales', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Datos confidenciales</span>
                  </label>
                  {formData.informationCategories?.datosConfidenciales && (
                    <input
                      type="text"
                      placeholder="Especificar..."
                      value={formData.informationCategories?.datosConfidencialesEspecificar || ''}
                      onChange={e => handleCategoryChange('datosConfidencialesEspecificar', e.target.value)}
                      className="w-full ml-6 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.informationCategories?.propiedadIntelectual || false}
                    onChange={e => handleCategoryChange('propiedadIntelectual', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Propiedad Intelectual</span>
                </label>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="opportunity-form"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
