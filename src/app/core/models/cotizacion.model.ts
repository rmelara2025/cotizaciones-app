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
