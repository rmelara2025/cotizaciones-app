export interface IUsuarioLogin {
    idUsuario: string;
    clave: string;
}

export interface IUsuario {
    nombreUsuario: string;
    email: string;
    idUsuario?: string;
    rol?: string;
    [key: string]: unknown;
}
