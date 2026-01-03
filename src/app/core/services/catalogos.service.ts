import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface IServicio {
    idServicio: number;
    nombre: string;
    descripcion: string;
    idFamilia: number;
    nombreFamilia: string;
    atributosSchema: string; // JSON schema para validar atributos
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
}
