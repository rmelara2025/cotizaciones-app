import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ICotizacionDetalle, IPaginatedCotizacionResponse } from '../models';

@Injectable({
    providedIn: 'root',
})
export class CotizacionesService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/api';
    cotizacionDetalle = signal<ICotizacionDetalle[]>([]);
    totalRecords = signal(0);
    currentPage = signal(0);
    pageSize = signal(10);
    loading = signal(false);
    error = signal<string | null>(null);

    loadCotizacionDetalle(idContrato: string, page: number = 0, size: number = 10) {
        this.loading.set(true);
        this.error.set(null);
        this.currentPage.set(page);
        this.pageSize.set(size);

        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'numItem,desc');

        const url = `${this.API_URL}/cotizaciones/${idContrato}/detalle`;

        this.http.get<IPaginatedCotizacionResponse>(url, { params }).subscribe({
            next: (response) => {
                this.cotizacionDetalle.set(response.content || []);
                this.totalRecords.set(response.totalElements || 0);
                // ✔️ Usar el número real que viene del backend
                this.currentPage.set(response.number);
                this.pageSize.set(response.size);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading cotizacion detalle:', err);
                this.error.set('No se pudo cargar el detalle de la cotización: ' + err.message);
                this.loading.set(false);
            },
        });
    }

    createDetalle(idContrato: string, payload: Partial<ICotizacionDetalle>) {
        return this.http.post<ICotizacionDetalle>(`${this.API_URL}/cotizaciones/${idContrato}/detalle`, payload);
    }

    // Crea un ítem de cotización usando el endpoint global /api/cotizaciones
    createCotizacionItem(payload: {
        idContrato: string;
        idServicio: number;
        cantidad: number;
        recurrente: number;
        idTipoMoneda: number;
        atributos: string;
    }) {
        return this.http.post<ICotizacionDetalle>(`${this.API_URL}/cotizaciones`, payload);
    }

    // Edita un ítem de cotización usando PUT /api/cotizaciones/editar
    updateCotizacionItem(payload: {
        idDetalle: string;
        numItem: number;
        idContrato: string;
        idServicio: number;
        cantidad: number;
        recurrente: number;
        idTipoMoneda: number;
        atributos: string;
    }) {
        return this.http.put<ICotizacionDetalle>(`${this.API_URL}/cotizaciones/editar`, payload);
    }

    updateDetalle(idContrato: string, idDetalle: string, payload: Partial<ICotizacionDetalle>) {
        return this.http.put<ICotizacionDetalle>(
            `${this.API_URL}/cotizaciones/${idContrato}/detalle/${idDetalle}`,
            payload,
        );
    }

    deleteDetalle(idContrato: string, idDetalle: string) {
        return this.http.delete<void>(`${this.API_URL}/cotizaciones/${idContrato}/detalle/${idDetalle}`);
    }
}
