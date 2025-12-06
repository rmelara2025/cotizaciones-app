import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

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
    totalRecurrente: number;
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
    totalRecurrenteGlobal = signal(0);

    // Separado: para cálculo de totales sin afectar tabla paginada
    todosParaTotales = signal<IContrato[]>([]);


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

                this.totalRecurrenteGlobal.set(
                    (response.content || [])
                        .reduce((acc, row) => acc + (Number(row.totalRecurrente) || 0), 0)
                );

                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading contratos:', err);
                this.error.set('No se pudieron cargar los contratos: ' + err.message);
                this.loading.set(false);
            }
        });
    }

    /**
     * Carga todos los registros (sin paginación) solo para calcular totales
     * No afecta la tabla paginada, solo actualiza todosParaTotales signal
     */
    cargarTodosParaTotales(
        sortField: string = 'fechaInicio',
        sortOrder: 'asc' | 'desc' = 'desc',
        filters: any
    ): Observable<IPaginatedResponse | null> {
        console.log('🔄 Loading ALL contratos for totals calculation');

        let params = new HttpParams()
            .set('page', '0')
            .set('size', '99999')  // Número grande para traer todos
            .set('sort', `${sortField},${sortOrder}`);

        Object.keys(filters || {}).forEach(key => {
            if (filters[key] != null && filters[key] !== '' && filters[key] !== undefined) {
                params = params.set(key, filters[key]);
            }
        });

        return this.http.get<IPaginatedResponse>(`${this.API_URL}/contratos`, { params }).pipe(
            tap(response => {
                console.log('✅ All contratos loaded for totals:', response.content?.length);
                this.todosParaTotales.set(response.content || []);

                // Calcular también el global aquí
                this.totalRecurrenteGlobal.set(
                    (response.content || [])
                        .reduce((acc, row) => acc + (Number(row.totalRecurrente) || 0), 0)
                );
            }),
            catchError(err => {
                console.error('❌ Error loading all contratos for totals:', err);
                return of(null);
            })
        );
    }
}

