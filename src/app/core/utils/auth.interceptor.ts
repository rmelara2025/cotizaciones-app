import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para renovar la sesión en cada petición HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // Si el usuario está autenticado y no es una petición de login,
    // renovar la sesión
    if (authService.isAuthenticated() && !req.url.includes('/usuario/validar')) {
        authService.renewSession();
    }

    return next(req);
};
