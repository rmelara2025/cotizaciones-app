import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { IContrato, IPaginatedContratoResponse } from '../models';

@Injectable({
    providedIn: 'root',
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

    /**
     * Build HttpParams from pagination, sort, and filter parameters
     * Shared utility to avoid duplication in load methods
     */
    private buildHttpParams(
        page: number,
        size: number,
        sortField: string,
        sortOrder: string,
        filters?: any,
    ): HttpParams {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', `${sortField},${sortOrder}`);

        // Add filters if provided
        if (filters) {
            Object.keys(filters).forEach((key) => {
                if (filters[key] != null && filters[key] !== '' && filters[key] !== undefined) {
                    params = params.set(key, filters[key]);
                }
            });
        }

        return params;
    }

    loadContratos(
        page: number = 0,
        size: number = 10,
        sortField: string = 'fechaInicio',
        sortOrder: 'asc' | 'desc' = 'desc',
        filters: any,
    ) {
        this.loading.set(true);
        this.error.set(null);
        this.currentPage.set(page);
        this.pageSize.set(size);

        const params = this.buildHttpParams(page, size, sortField, sortOrder, filters);

        this.http.get<IPaginatedContratoResponse>(`${this.API_URL}/contratos`, { params }).subscribe({
            next: (response) => {
                this.contratos.set(response.content || []);
                this.totalRecords.set(response.totalElements || 0);

                this.totalRecurrenteGlobal.set(
                    (response.content || []).reduce(
                        (acc, row) => acc + (Number(row.totalRecurrente) || 0),
                        0,
                    ),
                );

                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading contratos:', err);
                this.error.set('No se pudieron cargar los contratos: ' + err.message);
                this.loading.set(false);
            },
        });
    }

    /**
     * Carga todos los registros (sin paginación) solo para calcular totales
     * No afecta la tabla paginada, solo actualiza todosParaTotales signal
     */
    cargarTodosParaTotales(
        sortField: string = 'fechaInicio',
        sortOrder: 'asc' | 'desc' = 'desc',
        filters: any,
    ): Observable<IPaginatedContratoResponse | null> {
        const params = this.buildHttpParams(0, 99999, sortField, sortOrder, filters);

        return this.http.get<IPaginatedContratoResponse>(`${this.API_URL}/contratos`, { params }).pipe(
            tap((response) => {
                this.todosParaTotales.set(response.content || []);

                // Calcular también el global aquí
                this.totalRecurrenteGlobal.set(
                    (response.content || []).reduce(
                        (acc, row) => acc + (Number(row.totalRecurrente) || 0),
                        0,
                    ),
                );
            }),
            catchError((err) => {
                console.error('❌ Error loading all contratos for totals:', err);
                return of(null);
            }),
        );
    }
}
