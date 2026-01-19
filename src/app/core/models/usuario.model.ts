export interface IUsuarioLogin {
    idUsuario: string;
    clave: string;
}

export interface IRol {
    idrol: number;
    nombreRol: string;
    permisos: string[];
}

export interface IUsuario {
    nombreUsuario: string;
    email: string;
    idUsuario?: string;
    rol?: string;
    roles?: IRol[];
    [key: string]: unknown;
}
