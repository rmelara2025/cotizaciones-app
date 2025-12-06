import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface CotizacionDetalle {
    idDetalle: string;
    numItem: number;
    versionCotizacion: number;
    idContrato: string;
    idServicio: number;
    cantidad: number;
    recurrente: number;
    atributos: any;
    fechaRegistro: string;
    nombreServicio: string;
    nombreFamilia: string;
    nombreTipoMoneda: string;
    [key: string]: any;
}

export interface IPaginatedResponse {
    content: CotizacionDetalle[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class CotizacionesService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/api';
    cotizacionDetalle = signal<CotizacionDetalle[]>([]);
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

        this.http.get<IPaginatedResponse>(url, { params }).subscribe({
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
            }
        });
    }
}
