import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para agregar automáticamente el ID del usuario logueado
 * en las cabeceras de las peticiones HTTP
 * 
 * Header agregado: X-User-Id: {idUsuario}
 */
export const userIdInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const userId = authService.getCurrentUserId();

    // Solo agregar header si hay usuario logueado y no es una petición de login
    if (userId && !req.url.includes('/validar')) {
        const modifiedReq = req.clone({
            headers: req.headers.set('X-User-Id', userId)
        });
        return next(modifiedReq);
    }

    return next(req);
};
