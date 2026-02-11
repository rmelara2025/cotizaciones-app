import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IServicio {
    idServicio: number;
    nombre: string;
    descripcion: string;
    idFamilia: number;
    nombreFamilia: string;
    atributosSchema: string; // JSON schema para validar atributos
}

export interface IFamilia {
    idFamilia?: number;
    nombreFamilia: string;
    descripcion: string;
}

export interface IServicioDetalle {
    idServicio?: number;
    idFamilia: number;
    nombre: string;  // Changed from nombreServicio to nombre
    nombreFamilia?: string;
    descripcion: string;
    atributosSchema?: string;  // Changed from atributos to atributosSchema
    idProveedor?: number;
}

export interface ITipoMoneda {
    idTipoMoneda: number;
    nombreTipoMoneda: string;
    codigo: string;
}

export interface IPeriodicidad {
    idPeriodicidad: number;
    nombre: string;
    meses: number;
    descripcion: string;
}

export interface IProveedor {
    idProveedor?: number;
    nombreProveedor: string;
    razonSocialProveedor?: string;
    contactoProveedor?: string;
    telefonoProveedor?: string;
    emailProveedor?: string;
    estado?: number;
    rutProveedor?: string;
    serviciosIds?: number[];
}

export interface IProveedorDetalle extends IProveedor {
    servicios?: IProveedorServicio[];
}

export interface IProveedorServicio {
    idProveedorServicio: number;
    idServicio: number;
    nombreServicio: string;
    descripcion: string;
}

@Injectable({
    providedIn: 'root',
})
export class CatalogosService {
    private http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    servicios = signal<IServicio[]>([]);
    monedas = signal<ITipoMoneda[]>([]);
    periodicidades = signal<IPeriodicidad[]>([]);

    loadingServicios = signal(false);
    loadingMonedas = signal(false);
    loadingPeriodicidades = signal(false);

    loadServicios() {
        this.loadingServicios.set(true);
        this.http.get<IServicio[]>(`${this.API_URL}/catalogos/servicios`).subscribe({
            next: (data) => {
                this.servicios.set(data);
                this.loadingServicios.set(false);
            },
            error: (err) => {
                console.error('Error cargando servicios:', err);
                this.loadingServicios.set(false);
            }
        });
    }

    loadMonedas() {
        this.loadingMonedas.set(true);
        this.http.get<ITipoMoneda[]>(`${this.API_URL}/catalogos/monedas`).subscribe({
            next: (data) => {
                this.monedas.set(data);
                this.loadingMonedas.set(false);
            },
            error: (err) => {
                console.error('Error cargando monedas:', err);
                this.loadingMonedas.set(false);
            }
        });
    }

    loadPeriodicidades() {
        this.loadingPeriodicidades.set(true);
        this.http.get<IPeriodicidad[]>(`${this.API_URL}/catalogos/periodicidades`).subscribe({
            next: (data) => {
                this.periodicidades.set(data);
                this.loadingPeriodicidades.set(false);
            },
            error: (err) => {
                console.error('Error cargando periodicidades:', err);
                this.loadingPeriodicidades.set(false);
            }
        });
    }

    // CRUD Familias
    listarFamilias(): Observable<IFamilia[]> {
        return this.http.get<IFamilia[]>(`${this.API_URL}/catalogos/familias`);
    }

    crearFamilia(familia: IFamilia): Observable<IFamilia> {
        return this.http.post<IFamilia>(`${this.API_URL}/catalogos/familias`, familia);
    }

    actualizarFamilia(idFamilia: number, familia: IFamilia): Observable<IFamilia> {
        return this.http.put<IFamilia>(`${this.API_URL}/catalogos/familias/${idFamilia}`, familia);
    }

    eliminarFamilia(idFamilia: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/catalogos/familias/${idFamilia}`);
    }

    // CRUD Servicios
    listarServicios(): Observable<IServicioDetalle[]> {
        return this.http.get<IServicioDetalle[]>(`${this.API_URL}/catalogos/servicios`);
    }

    crearServicio(servicio: IServicioDetalle): Observable<any> {
        // Convert to backend DTO format
        const dto = {
            idFamilia: servicio.idFamilia,
            nombreServicio: servicio.nombre,
            descripcion: servicio.descripcion,
            atributos: servicio.atributosSchema?.trim() || null // Enviar null si está vacío
        };
        return this.http.post<any>(`${this.API_URL}/catalogos/servicios`, dto);
    }

    actualizarServicio(idServicio: number, servicio: IServicioDetalle): Observable<any> {
        // Convert to backend DTO format
        const dto = {
            idServicio: idServicio,
            idFamilia: servicio.idFamilia,
            nombreServicio: servicio.nombre,
            descripcion: servicio.descripcion,
            atributos: servicio.atributosSchema?.trim() || null, // Enviar null si está vacío
            idProveedor: servicio.idProveedor
        };
        return this.http.put<any>(`${this.API_URL}/catalogos/servicios/${idServicio}`, dto);
    }

    eliminarServicio(idServicio: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/catalogos/servicios/${idServicio}`);
    }

    // CRUD Proveedores
    listarProveedores(): Observable<IProveedor[]> {
        return this.http.get<IProveedor[]>(`${this.API_URL}/catalogos/proveedores`);
    }

    obtenerProveedorDetalle(idProveedor: number): Observable<IProveedorDetalle> {
        return this.http.get<IProveedorDetalle>(`${this.API_URL}/catalogos/proveedores/${idProveedor}`);
    }

    crearProveedor(proveedor: IProveedor): Observable<IProveedor> {
        return this.http.post<IProveedor>(`${this.API_URL}/catalogos/proveedores`, proveedor);
    }

    actualizarProveedor(idProveedor: number, proveedor: IProveedor): Observable<IProveedor> {
        return this.http.put<IProveedor>(`${this.API_URL}/catalogos/proveedores/${idProveedor}`, proveedor);
    }

    eliminarProveedor(idProveedor: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/catalogos/proveedores/${idProveedor}`);
    }

    relacionarServicioProveedor(idProveedor: number, idServicio: number): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/catalogos/proveedores/${idProveedor}/servicios/${idServicio}`, {});
    }

    eliminarRelacionServicioProveedor(idProveedor: number, idServicio: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/catalogos/proveedores/${idProveedor}/servicios/${idServicio}`);
    }

    // Obtener proveedores por servicio
    obtenerProveedoresPorServicio(idServicio: number): Observable<IProveedor[]> {
        return this.http.get<IProveedor[]>(`${this.API_URL}/catalogos/servicios/${idServicio}/proveedores`);
    }
}
