/**
 * Typed filter interface for Contrato search/filtering
 */
export interface IContratoFilters {
    rutCliente: string;
    nombreCliente: string;
    codChi: string;
    codSap: string;
    codSison: string;
    estado: 'todos' | 'vigente' | 'por-expirar' | 'expirado';
    idFamiliaServicio?: number | null;
    idServicio?: number | null;
}

/**
 * Default/empty filters object
 */
export const DEFAULT_CONTRATO_FILTER: IContratoFilters = {
  rutCliente: '',
  nombreCliente: '',
  codChi: '',
  codSap: '',
  codSison: '',
  estado: 'todos',
  idFamiliaServicio: null,
  idServicio: null,
};