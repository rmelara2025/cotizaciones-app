export interface IContrato {
    idContrato: string;
    rutCliente: string;
    nombreTipoPago: string;
    nombreCliente: string;
    fechaInicio: string;
    fechaTermino: string;
    codSap: string | null;
    codChi: string;
    codSison: string | null;
    version: number;
    [key: string]: any;
}

export interface IPaginatedContratoResponse {
    content: IContrato[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    [key: string]: any;
}
