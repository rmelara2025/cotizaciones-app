import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ICliente, IPaginatedClienteResponse } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ClientesService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/api';

    clientes = signal<ICliente[]>([]);
    totalRecords = signal(0);
    currentPage = signal(0);
    pageSize = signal(10);
    loading = signal(false);
    error = signal<string | null>(null);

    /**
     * Carga la lista de clientes con paginación, ordenamiento y filtros
     */
    loadClientes(
        page: number = 0,
        size: number = 10,
        sortField: string = 'rutCliente',
        sortOrder: string = 'desc',
        filters?: { nombreCliente?: string; rutCliente?: string }
    ) {
        this.loading.set(true);
        this.error.set(null);
        this.currentPage.set(page);
        this.pageSize.set(size);

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', `${sortField},${sortOrder}`);

        // Agregar filtros si existen
        if (filters?.nombreCliente) {
            params = params.set('nombreCliente', filters.nombreCliente);
        }
        if (filters?.rutCliente) {
            params = params.set('rutCliente', filters.rutCliente);
        }

        this.http.get<IPaginatedClienteResponse>(`${this.API_URL}/clientes`, { params }).subscribe({
            next: (response) => {
                this.clientes.set(response.content || []);
                this.totalRecords.set(response.totalElements || 0);
                this.currentPage.set(response.number);
                this.pageSize.set(response.size);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error cargando clientes:', err);
                this.error.set('No se pudo cargar la lista de clientes: ' + err.message);
                this.loading.set(false);
            },
        });
    }
}
