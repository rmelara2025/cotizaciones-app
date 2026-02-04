// src/app/features/dashboard/dashboard.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IDashboardContrato } from '../models';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IDashboardResumenItem {
    nombreTipoMoneda: string;
    totalRecurrente: number;
    estado?: string;
    cantidadContratos?: number;
}

export interface IDashboardResumen {
    content: IDashboardResumenItem[];
    [key: string]: any;
}

export interface IDashboardFilter {
    rut?: string;
    nombre?: string;
    idFamiliaServicio?: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API = environment.apiUrl + '/dashboard';

    resumenRecurrentes = signal<IDashboardResumenItem[]>([]);
    loadingResumen = signal(false);
    errorResumen = signal<string | null>(null);

    getContratosDashboard(): Observable<IDashboardContrato[]> {
        return this.http.get<IDashboardContrato[]>(`${this.API}/recurrentes`);
    }

    /**
     * Obtiene el resumen de recurrentes por moneda
     * Si no se pasa filtro, trae el universo completo
     */
    loadResumenRecurrentes(filter?: IDashboardFilter) {
        this.loadingResumen.set(true);
        this.errorResumen.set(null);

        const body = filter ? { ...filter } : {};

        this.http.post<IDashboardResumen | IDashboardResumenItem[]>(`${this.API}/custom`, body).subscribe({
            next: (response) => {
                const items = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.content)
                        ? response.content
                        : [];
                this.resumenRecurrentes.set(items);
                this.loadingResumen.set(false);
            },
            error: (err) => {
                console.error('❌ Error cargando resumen recurrentes:', err);
                this.errorResumen.set('No se pudo cargar el resumen de recurrentes: ' + err.message);
                this.loadingResumen.set(false);
            },
        });
    }
}
