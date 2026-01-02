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
