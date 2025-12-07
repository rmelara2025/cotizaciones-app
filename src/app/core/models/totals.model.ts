/**
 * Totals model and calculation interface
 */
export interface ITotals {
    totalRecurrenteFiltrado: number;
    totalesPorMoneda: Record<string, number>;
}

export const EMPTY_TOTALS: ITotals = {
    totalRecurrenteFiltrado: 0,
    totalesPorMoneda: {},
};
