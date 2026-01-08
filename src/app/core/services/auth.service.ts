import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { IUsuario, IUsuarioLogin } from '../models';
import { catchError, tap } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';

const SESSION_KEY = 'cmdb_user_session';
const SESSION_TIMESTAMP_KEY = 'cmdb_session_timestamp';
const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutos

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private readonly API_URL = environment.apiUrl;

    // Estado de la sesión
    currentUser = signal<IUsuario | null>(null);
    isAuthenticated = computed(() => this.currentUser() !== null);
    loading = signal(false);
    error = signal<string | null>(null);
    sessionTimeRemaining = signal<number>(0); // Tiempo restante en segundos

    private sessionTimer: ReturnType<typeof setTimeout> | null = null;
    private countdownInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Cargar sesión desde localStorage al iniciar
        this.loadSessionFromStorage();

        // Verificar sesión cada minuto
        setInterval(() => this.checkSessionExpiry(), 60000);

        // Actualizar contador cada segundo
        this.startCountdown();
    }

    /**
     * Inicia sesión con las credenciales del usuario
     */
    async login(credentials: IUsuarioLogin): Promise<boolean> {
        this.loading.set(true);
        this.error.set(null);

        const url = `${this.API_URL}/usuario/validar`;

        try {
            const response = await firstValueFrom(
                this.http.post<IUsuario>(url, credentials).pipe(
                    tap((usuario) => {
                        this.setUserSession(usuario);
                    }),
                    catchError((error) => {
                        console.error('Error en login:', error);
                        this.error.set(error.error?.message || 'Error al iniciar sesión');
                        return of(null);
                    })
                )
            );

            this.loading.set(false);
            return response !== null;
        } catch (error) {
            console.error('Error inesperado en login:', error);
            this.error.set('Error al iniciar sesión');
            this.loading.set(false);
            return false;
        }
    }

    /**
     * Cierra la sesión del usuario
     */
    logout(): void {
        this.clearSession();
        this.router.navigate(['/login']);
    }

    /**
     * Establece la sesión del usuario
     */
    private setUserSession(usuario: IUsuario): void {
        const timestamp = Date.now();
        this.currentUser.set(usuario);

        // Guardar en localStorage
        localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
        localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());

        // Programar cierre automático de sesión
        this.scheduleSessionExpiry();

        // Actualizar tiempo restante inmediatamente
        this.updateTimeRemaining();
    }

    /**
     * Carga la sesión desde localStorage
     */
    private loadSessionFromStorage(): void {
        const userData = localStorage.getItem(SESSION_KEY);
        const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

        if (userData && timestamp) {
            const sessionAge = Date.now() - parseInt(timestamp, 10);

            if (sessionAge < SESSION_DURATION_MS) {
                const usuario = JSON.parse(userData) as IUsuario;
                this.currentUser.set(usuario);
                this.scheduleSessionExpiry(SESSION_DURATION_MS - sessionAge);
                // Actualizar tiempo restante inmediatamente
                this.updateTimeRemaining();
            } else {
                // Sesión expirada
                this.clearSession();
            }
        }
    }

    /**
     * Programa el cierre automático de sesión
     */
    private scheduleSessionExpiry(customDuration?: number): void {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        const duration = customDuration || SESSION_DURATION_MS;
        this.sessionTimer = setTimeout(() => {
            this.logout();
        }, duration);
    }

    /**
     * Verifica si la sesión ha expirado
     */
    private checkSessionExpiry(): void {
        const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

        if (timestamp) {
            const sessionAge = Date.now() - parseInt(timestamp, 10);

            if (sessionAge >= SESSION_DURATION_MS) {
                this.logout();
            }
        }
    }

    /**
     * Limpia toda la información de sesión
     */
    private clearSession(): void {
        this.currentUser.set(null);
        this.sessionTimeRemaining.set(0);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);

        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    /**
     * Obtiene el usuario actual (útil para logging y auditoría)
     */
    getCurrentUser(): IUsuario | null {
        return this.currentUser();
    }

    /**
     * Renueva la sesión (útil para mantener la sesión activa)
     */
    renewSession(): void {
        const timestamp = Date.now();
        localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());
        this.scheduleSessionExpiry();
    }

    /**
     * Inicia el contador de tiempo restante
     */
    private startCountdown(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        this.countdownInterval = setInterval(() => {
            this.updateTimeRemaining();
        }, 1000);
    }

    /**
     * Actualiza el tiempo restante de sesión
     */
    private updateTimeRemaining(): void {
        const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

        if (timestamp && this.isAuthenticated()) {
            const sessionAge = Date.now() - parseInt(timestamp, 10);
            const remaining = SESSION_DURATION_MS - sessionAge;

            if (remaining > 0) {
                this.sessionTimeRemaining.set(Math.floor(remaining / 1000));
            } else {
                this.sessionTimeRemaining.set(0);
            }
        } else {
            this.sessionTimeRemaining.set(0);
        }
    }
}
