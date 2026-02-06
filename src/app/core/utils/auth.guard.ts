import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirigir al login si no está autenticado
    router.navigate(['/login']);
    return false;
};

/**
 * Guard para redirigir usuarios autenticados lejos del login
 */
export const loginGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        // Si ya está autenticado, redirigir a cotizaciones
        router.navigate(['/cotizaciones']);
        return false;
    }

    return true;
};
