import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface LogEntry {
    timestamp: Date;
    usuario: string;
    accion: string;
    detalles?: string;
    nivel: 'info' | 'warning' | 'error';
}

@Injectable({
    providedIn: 'root',
})
export class LoggingService {
    private authService = inject(AuthService);

    /**
     * Registra una acción del usuario actual
     */
    log(accion: string, detalles?: string, nivel: 'info' | 'warning' | 'error' = 'info'): void {
        const usuario = this.authService.getCurrentUser();
        const entry: LogEntry = {
            timestamp: new Date(),
            usuario: usuario?.nombreUsuario || usuario?.email || 'ANÓNIMO',
            accion,
            detalles,
            nivel,
        };

        // Log en consola para desarrollo
        console.log(`[${nivel.toUpperCase()}] ${entry.usuario}: ${accion}`, detalles || '');

        // Aquí puedes agregar la lógica para enviar al backend si es necesario
        // this.http.post(`${API_URL}/logs`, entry).subscribe();
    }

    /**
     * Log de información
     */
    info(accion: string, detalles?: string): void {
        this.log(accion, detalles, 'info');
    }

    /**
     * Log de advertencia
     */
    warning(accion: string, detalles?: string): void {
        this.log(accion, detalles, 'warning');
    }

    /**
     * Log de error
     */
    error(accion: string, detalles?: string): void {
        this.log(accion, detalles, 'error');
    }
}
