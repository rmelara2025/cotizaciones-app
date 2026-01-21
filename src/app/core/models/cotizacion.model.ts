export interface ICotizacionDetalle {
    idDetalle: string;
    numItem: number;
    versionCotizacion: number;
    idContrato: string;
    idServicio: number;
    idFamilia: number;
    cantidad: number;
    recurrente: number;
    atributos: any;
    fechaRegistro: string;
    nombreServicio: string;
    nombreFamilia: string;
    nombreTipoMoneda: string;
    idTipoMoneda: number;
    [key: string]: any;
}

export interface IPaginatedCotizacionResponse {
    content: ICotizacionDetalle[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    [key: string]: any;
}

/**
 * Modelo para cotización (cabecera) - Respuesta del backend
 */
export interface ICotizacion {
    idCotizacion: string;
    idContrato: string;
    numeroCotizacion: string;
    version: number;
    estadoNombre: string;
    estadoDescripcion: string;
    fechaEmision: string;          // formato dd-MM-yyyy
    fechaVigenciaDesde: string;    // formato dd-MM-yyyy
    fechaVigenciaHasta: string;    // formato dd-MM-yyyy
    observacion: string;
    fechaRegistro: string;         // formato dd-MM-yyyy HH:mm:ss
}

/**
 * Interfaz para los estados de cotización
 */
export interface IEstadoCotizacion {
    idEstadoCotizacion: number;
    nombre: string;
    ordern: number;
    descripcion: string;
}

/**
 * Interfaz para el detalle completo de una cotización con sus items y totales
 */
export interface ICotizacionDetalleCompleta {
    idCotizacion: string;
    numeroCotizacion: string;
    version: number;
    idestadoCotizacion: number;
    nombreEstado: string;
    fechaCreacion: string;
    fechaVigencia: string;
    fechaVencimiento: string;
    observacion: string;
    items: ICotizacionDetalleItem[];
    totales: ICotizacionTotal[];
}

export interface ICotizacionDetalleItem {
    numItem: number;
    idServicio: number;
    nombreServicio: string;
    nombreFamilia: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    idTipoMoneda: number;
    nombreMoneda: string;
    idPeriodicidad: number;
    nombrePeriodicidad: string;
    fechaInicioFacturacion: string;
    fechaFinFacturacion: string;
    atributos: string;
    observacion: string;
}

export interface ICotizacionTotal {
    idTipoMoneda: number;
    nombreMoneda: string;
    montoTotal: number;
}

export interface IVersionResponse {
    idNuevaCotizacion: string;
    numeroCotizacion: string;
    version: number;
}

/**
 * Interfaz para las acciones de transición de estado disponibles para un usuario
 */
export interface IAccionDisponible {
    idTransicion: number;
    idEstadoDestino: number;
    nombreEstadoDestino: string;
    descripcion: string;
    requiereComentario: boolean;
    requiereMotivoRechazo: boolean;
}

