export interface IContacto {
    idcontacto?: number;
    rutCliente: string;
    nombre: string;
    email: string;
    telefono: string;
    cargo: string;
}

export interface IContactoCreate {
    rutCliente: string;
    nombre: string;
    email: string;
    telefono: string;
    cargo: string;
}

export interface IContactoUpdate {
    rutCliente: string;
    nombre: string;
    email: string;
    telefono: string;
    cargo: string;
}

export const CARGO_OPTIONS = [
    { label: 'JP', value: 'JP' },
    { label: 'Comercial', value: 'Comercial' },
    { label: 'Cliente', value: 'Cliente' },
    { label: 'Proveedor', value: 'Proveedor' }
];
