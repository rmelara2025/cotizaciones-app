import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface ICotizacionCreateRequest {
    idContrato: string;
    idUsuarioCreacion?: string; // Opcional, puede venir del interceptor
    fechaEmision: string; // formato: 'YYYY-MM-DD'
    fechaVigenciaDesde?: string;
    fechaVigenciaHasta?: string;
    observacion?: string;
}

export interface ICotizacionResponse {
    idCotizacion: string;
    idContrato: string;
    numeroCotizacion: string;
    version: number;
    estadoNombre: string;
    estadoDescripcion?: string;
    observacion?: string;
}

/**
 * Servicio para gestionar cotizaciones
 */
@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = environment.apiUrl;

    loading = signal(false);
    error = signal<string | null>(null);

    /**
     * Crea una nueva cotización
     * El código de cotización (COT-YYYY-NNNNNNNN) se genera automáticamente en el backend
     * El idUsuarioCreacion se toma del usuario logueado actual
     */
    async crearCotizacion(request: ICotizacionCreateRequest): Promise<ICotizacionResponse | null> {
        this.loading.set(true);
        this.error.set(null);

        // ⭐ Agregar ID del usuario logueado automáticamente
        const userId = this.authService.getCurrentUserId();
        if (!userId) {
            this.error.set('No hay usuario logueado');
            this.loading.set(false);
            return null;
        }

        const payload: ICotizacionCreateRequest = {
            ...request,
            idUsuarioCreacion: userId
        };

        const url = `${this.API_URL}/cotizaciones`;

        try {
            const response = await firstValueFrom(
                this.http.post<ICotizacionResponse>(url, payload)
            );

            this.loading.set(false);
            return response;
        } catch (error) {
            console.error('Error al crear cotización:', error);
            this.error.set('Error al crear cotización');
            this.loading.set(false);
            return null;
        }
    }

    /**
     * Versiona una cotización existente
     * Genera un nuevo código automáticamente
     */
    async versionarCotizacion(idCotizacion: string): Promise<ICotizacionResponse | null> {
        this.loading.set(true);
        this.error.set(null);

        const url = `${this.API_URL}/cotizaciones/${idCotizacion}/versionar`;

        try {
            const response = await firstValueFrom(
                this.http.post<ICotizacionResponse>(url, {})
            );

            this.loading.set(false);
            return response;
        } catch (error) {
            console.error('Error al versionar cotización:', error);
            this.error.set('Error al versionar cotización');
            this.loading.set(false);
            return null;
        }
    }

    /**
     * Actualiza el estado de una cotización
     */
    async actualizarEstado(
        idCotizacion: string,
        idEstadoCotizacion: number,
        comentario?: string,
        motivoRechazo?: string
    ): Promise<boolean> {
        this.loading.set(true);
        this.error.set(null);

        const url = `${this.API_URL}/cotizaciones/${idCotizacion}/estado`;

        // ⭐ Agregar ID del usuario logueado automáticamente
        const userId = this.authService.getCurrentUserId();

        try {
            await firstValueFrom(
                this.http.put(url, {
                    idEstadoCotizacion,
                    comentario,
                    motivoRechazo,
                    idUsuarioModificacion: userId
                })
            );

            this.loading.set(false);
            return true;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            this.error.set('Error al actualizar estado');
            this.loading.set(false);
            return false;
        }
    }
}
