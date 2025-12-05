// src/app/features/dashboard/models/dashboard.model.ts
export interface DashboardContrato {
    moneda: string;
    estado: 'expirado' | 'por-expirar' | 'vigente';
    totalRecurrente: number;
    countContratos: number;
}
