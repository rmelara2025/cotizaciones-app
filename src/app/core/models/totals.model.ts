/**
 * Totals model and calculation interface
 */
export interface Totals {
    totalRecurrenteFiltrado: number;
    totalesPorMoneda: Record<string, number>;
}

export const EMPTY_TOTALS: Totals = {
    totalRecurrenteFiltrado: 0,
    totalesPorMoneda: {}
};
