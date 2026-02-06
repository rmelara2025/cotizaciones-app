export interface ICliente {
    rutCliente: string;
    nombreCliente: string;
    nombreComercial: string;
    razonSocial: string;
    estado: number;
}

export interface IClienteCreate {
    rutCliente: string;
    nombreCliente: string;
    nombreComercial: string;
    razonSocial: string;
}

export interface IClienteUpdate {
    nombreCliente: string;
    nombreComercial: string;
    razonSocial: string;
}

export interface IPaginatedClienteResponse {
    content: ICliente[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface IClienteFilters {
    nombreCliente?: string;
    rutCliente?: string;
}

export const DEFAULT_CLIENTE_FILTER: IClienteFilters = {
    nombreCliente: '',
    rutCliente: '',
};
