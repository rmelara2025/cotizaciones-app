import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface IContrato {
    idContrato: string;
    rutCliente: string;
    nombreTipoMoneda: string;
    nombreTipoPago: string;
    nombreCliente: string;
    fechaInicio: string;
    fechaTermino: string;
    codSap: string | null;
    codChi: string;
    codSison: string | null;
    [key: string]: any;
}

export interface IPaginatedResponse {
    content: IContrato[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class ContratosService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/api';

    contratos = signal<IContrato[]>([]);
    totalRecords = signal(0);
    currentPage = signal(0);
    pageSize = signal(10);
    loading = signal(false);
    error = signal<string | null>(null);

    loadContratos(
        page: number = 0,
        size: number = 10,
        sortField: string = 'fechaInicio',
        sortOrder: 'asc' | 'desc' = 'desc',
        filters: any
    ) {
        console.log('🔄 Loading contratos with params:', { page, size });
        this.loading.set(true);
        this.error.set(null);
        this.currentPage.set(page);
        this.pageSize.set(size);

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', `${sortField},${sortOrder}`);

        Object.keys(filters || {}).forEach(key => {
            if (filters[key] != null && filters[key] !== '' && filters[key] !== undefined) {
                params = params.set(key, filters[key]);
            }
        });

        this.http.get<IPaginatedResponse>(`${this.API_URL}/contratos`, { params }).subscribe({
            next: (response) => {
                console.log('✅ Contratos loaded successfully:', response);
                console.log('📊 Content:', response.content);
                console.log('📈 Total Records:', response.totalElements);
                this.contratos.set(response.content || []);
                this.totalRecords.set(response.totalElements || 0);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading contratos:', err);
                this.error.set('No se pudieron cargar los contratos: ' + err.message);
                this.loading.set(false);
            }
        });
    }
}

