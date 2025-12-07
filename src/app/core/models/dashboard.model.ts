export interface IDashboardContrato {
    moneda: string;
    estado: 'expirado' | 'por-expirar' | 'vigente';
    totalRecurrente: number;
    countContratos: number;
}
