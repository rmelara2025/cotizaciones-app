export interface IExpiryInfo {
    days: number | null;
    severity: 'high' | 'medium' | 'low' | null;
    tooltip: string;
    backgroundColor: string;
}
