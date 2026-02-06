import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ICliente, IPaginatedClienteResponse, IClienteCreate, IClienteUpdate } from '../models';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ClientesService {
    private http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

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

    /**
     * Obtiene un cliente por su RUT
     * @param rut RUT del cliente (con o sin formato)
     */
    async obtenerClientePorRut(rut: string): Promise<ICliente> {
        const url = `${this.API_URL}/clientes/${rut}`;
        return this.http.get<ICliente>(url).toPromise().then(response => {
            if (!response) {
                throw new Error('Cliente no encontrado');
            }
            return response;
        });
    }

    /**
     * Obtiene todos los clientes sin paginación (para dropdowns)
     */
    obtenerTodosParaDropdown() {
        const params = new HttpParams()
            .set('page', '0')
            .set('size', '1000')
            .set('sort', 'nombreCliente,asc');

        return this.http.get<IPaginatedClienteResponse>(`${this.API_URL}/clientes`, { params });
    }

    /**
     * Crea un nuevo cliente
     */
    async createCliente(cliente: IClienteCreate): Promise<ICliente> {
        const url = `${this.API_URL}/clientes`;
        return lastValueFrom(this.http.post<ICliente>(url, cliente));
    }

    /**
     * Actualiza un cliente existente
     */
    async updateCliente(rutCliente: string, cliente: IClienteUpdate): Promise<ICliente> {
        const url = `${this.API_URL}/clientes/${rutCliente}`;
        return lastValueFrom(this.http.put<ICliente>(url, cliente));
    }

    /**
     * Elimina un cliente
     */
    async deleteCliente(rutCliente: string): Promise<void> {
        const url = `${this.API_URL}/clientes/${rutCliente}`;
        return lastValueFrom(this.http.delete<void>(url));
    }
}
