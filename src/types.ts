export type OpportunityStatus = 'Planificado' | 'En curso' | 'Finalizada' | 'No priorizado' | 'Tests';

export interface Application {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  name: string;
  order: number;
}

export interface Process {
  id: string;
  activityId: string;
  name: string;
  order: number;
  applicationIds: string[];
}

export interface InformationCategories {
  datosPersonales: boolean;
  datosSensibles: boolean;
  datosPenales: boolean;
  datosFinancieros: boolean;
  datosInternos: boolean;
  datosInternosEspecificar?: string;
  datosConfidenciales: boolean;
  datosConfidencialesEspecificar?: string;
  propiedadIntelectual: boolean;
}

export interface Opportunity {
  id: string;
  processId: string;
  name: string;
  priority: number; // 1 (Baja) to 5 (Alta)
  impact: number; // 1 (Bajo) to 5 (Alto)
  difficulty: number; // 1 (Baja) to 5 (Alta)
  status: OpportunityStatus;
  proposedBy?: string;
  createdBy?: string;
  notes?: string;
  informationCategories?: InformationCategories;
}

export interface AppData {
  activities: Activity[];
  processes: Process[];
  opportunities: Opportunity[];
  applications: Application[];
}
