import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ICotizacionDetalle, IPaginatedCotizacionResponse, ICotizacion, IEstadoCotizacion } from '../models';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CotizacionesService {
    private http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    // Signals para detalle de cotización (antiguo)
    cotizacionDetalle = signal<ICotizacionDetalle[]>([]);
    totalRecords = signal(0);
    currentPage = signal(0);
    pageSize = signal(10);
    loading = signal(false);
    error = signal<string | null>(null);

    // Signals para lista de cotizaciones por contrato (nuevo)
    cotizaciones = signal<ICotizacion[]>([]);
    loadingCotizaciones = signal(false);
    errorCotizaciones = signal<string | null>(null);

    // Signals para estados de cotización
    estados = signal<IEstadoCotizacion[]>([]);
    loadingEstados = signal(false);

    /**
     * Obtiene la lista de cotizaciones de un contrato
     * GET /api/contratos/{idContrato}/cotizaciones
     */
    loadCotizacionesPorContrato(idContrato: string) {
        this.loadingCotizaciones.set(true);
        this.errorCotizaciones.set(null);

        const url = `${this.API_URL}/contratos/${idContrato}/cotizaciones`;

        this.http.get<ICotizacion[]>(url).subscribe({
            next: (response) => {
                this.cotizaciones.set(response || []);
                this.loadingCotizaciones.set(false);
            },
            error: (err) => {
                console.error('❌ Error loading cotizaciones:', err);
                this.errorCotizaciones.set('No se pudieron cargar las cotizaciones: ' + err.message);
                this.loadingCotizaciones.set(false);
            },
        });
    }

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

    /**
     * Actualiza el estado de una cotización
     * PUT /api/cotizaciones/{idCotizacion}/estado
     */
    actualizarEstado(idCotizacion: string, idEstadoCotizacion: number) {
        const url = `${this.API_URL}/cotizaciones/${idCotizacion}/estado`;
        return this.http.put<void>(url, { idEstadoCotizacion }).pipe(
            tap(() => {
                console.log('Estado actualizado correctamente');
            }),
            catchError((error) => {
                console.error('Error al actualizar estado:', error);
                throw error;
            })
        );
    }

    /**
     * Carga los estados de cotización disponibles
     */
    loadEstados() {
        // Estados hardcoded que coinciden con la DB
        const estadosHardcoded: IEstadoCotizacion[] = [
            { idEstadoCotizacion: 1, nombre: 'BORRADOR', ordern: 1, descripcion: 'Cotización en construcción' },
            { idEstadoCotizacion: 2, nombre: 'EN_REVISION', ordern: 2, descripcion: 'Enviada para revisión' },
            { idEstadoCotizacion: 3, nombre: 'APROBADA', ordern: 3, descripcion: 'Aprobada internamente' },
            { idEstadoCotizacion: 4, nombre: 'VIGENTE', ordern: 4, descripcion: 'Cotización actualmente vigente' },
            { idEstadoCotizacion: 5, nombre: 'REEMPLAZADA', ordern: 5, descripcion: 'Reemplazada por una nueva versión' },
            { idEstadoCotizacion: 6, nombre: 'ANULADA', ordern: 6, descripcion: 'Anulada por error o corrección' },
            { idEstadoCotizacion: 7, nombre: 'CANCELADA', ordern: 7, descripcion: 'Cancelada por el cliente' },
            { idEstadoCotizacion: 8, nombre: 'DE_BAJA', ordern: 8, descripcion: 'Dada de baja' },
        ];
        this.estados.set(estadosHardcoded);
    }
}
