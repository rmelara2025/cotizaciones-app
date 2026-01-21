import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { IUsuario, IUsuarioLogin, IRol } from '../models';
import { catchError, tap } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';

const SESSION_KEY = 'cmdb_user_session';
const SESSION_TIMESTAMP_KEY = 'cmdb_session_timestamp';
const ROLES_KEY = 'cmdb_user_roles';
const PERMISSIONS_KEY = 'cmdb_user_permissions';
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
    userRoles = signal<IRol[]>([]);
    userPermissions = signal<string[]>([]);
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

            if (response !== null) {
                // Cargar roles después de login exitoso
                await this.loadUserRoles();
            }

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
     * Carga los roles del usuario desde el backend
     */
    async loadUserRoles(): Promise<void> {
        if (!this.isAuthenticated()) {
            console.warn('⚠️ No se pueden cargar roles: usuario no autenticado');
            return;
        }

        const user = this.currentUser();
        if (!user?.idUsuario) {
            console.warn('⚠️ No se pueden cargar roles: idUsuario no disponible');
            return;
        }

        const url = `${this.API_URL}/usuario/${user.idUsuario}/roles`;
        console.log('🌐 Cargando roles desde:', url);

        try {
            const roles = await firstValueFrom(
                this.http.get<IRol[]>(url).pipe(
                    catchError((error) => {
                        console.error('❌ Error al cargar roles:', error);
                        console.error('❌ Status:', error.status);
                        console.error('❌ Message:', error.message);
                        return of([]);
                    })
                )
            );

            console.log('✅ Roles cargados:', roles);

            this.userRoles.set(roles);

            // Extraer todos los permisos únicos de todos los roles
            const allPermissions = new Set<string>();
            roles.forEach(rol => {
                if (rol.permisos && Array.isArray(rol.permisos)) {
                    rol.permisos.forEach(permiso => allPermissions.add(permiso));
                }
            });
            const permissionsArray = Array.from(allPermissions);
            this.userPermissions.set(permissionsArray);

            console.log('✅ Permisos extraídos:', permissionsArray);

            // Guardar en localStorage
            localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
            localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissionsArray));

            console.log('✅ Roles y permisos guardados en localStorage');
        } catch (error) {
            console.error('❌ Error inesperado al cargar roles:', error);
            this.userRoles.set([]);
            this.userPermissions.set([]);
        }
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
        const rolesData = localStorage.getItem(ROLES_KEY);
        const permissionsData = localStorage.getItem(PERMISSIONS_KEY);

        if (userData && timestamp) {
            const sessionAge = Date.now() - parseInt(timestamp, 10);

            if (sessionAge < SESSION_DURATION_MS) {
                const usuario = JSON.parse(userData) as IUsuario;
                this.currentUser.set(usuario);

                // Cargar roles si existen
                if (rolesData) {
                    try {
                        const roles = JSON.parse(rolesData) as IRol[];
                        this.userRoles.set(roles);
                    } catch {
                        this.userRoles.set([]);
                    }
                }

                // Cargar permisos si existen
                if (permissionsData) {
                    try {
                        const permissions = JSON.parse(permissionsData) as string[];
                        this.userPermissions.set(permissions);
                    } catch {
                        this.userPermissions.set([]);
                    }
                }

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
        this.userRoles.set([]);
        this.userPermissions.set([]);
        this.sessionTimeRemaining.set(0);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);
        localStorage.removeItem(ROLES_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);

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
     * Obtiene el ID del usuario actual (útil para operaciones de creación/modificación)
     */
    getCurrentUserId(): string | null {
        const user = this.currentUser();
        return user?.idUsuario || null;
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

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    hasPermission(permission: string): boolean {
        return this.userPermissions().includes(permission);
    }

    /**
     * Verifica si el usuario tiene al menos uno de los permisos especificados
     */
    hasAnyPermission(permissions: string[]): boolean {
        const userPerms = this.userPermissions();
        return permissions.some(perm => userPerms.includes(perm));
    }

    /**
     * Verifica si el usuario tiene todos los permisos especificados
     */
    hasAllPermissions(permissions: string[]): boolean {
        const userPerms = this.userPermissions();
        return permissions.every(perm => userPerms.includes(perm));
    }

    /**
     * Verifica si el usuario tiene un rol específico
     */
    hasRole(roleName: string): boolean {
        return this.userRoles().some(rol => rol.nombreRol === roleName);
    }
}
