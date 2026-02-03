export interface ICadenciaIngresosFilter {
  rutCliente?: string;
  fechaDesde?: string; // formato: YYYY-MM-DD
  fechaHasta?: string; // formato: YYYY-MM-DD
  idTipoMoneda?: number;
}

export interface ICadenciaIngresosResponse {
  clientes: ICadenciaCliente[];
}

export interface ICadenciaCliente {
  rutCliente: string;
  nombreCliente: string;
  ingresosMensuales: ICadenciaMes[];
  alertas: ICadenciaAlerta[];
}

export interface ICadenciaMes {
  mes: string; // formato: YYYY-MM
  monto: number;
  nombreMoneda: string;
  moneda: string; // CLP, USD, EUR
  variacionPorcentaje: number;
  serviciosActivos: number;
}

export interface ICadenciaAlerta {
  mes: string;
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA';
  mensaje: string;
  montoPerdiendose: number;
  serviciosQueTerminan: IServicioTermina[];
}

export interface IServicioTermina {
  nombreServicio: string;
  codigoContrato: string;
  montoMensual: number;
  fechaFinFacturacion: string;
  periodicidad: string;
  nombreMoneda: string;
}
