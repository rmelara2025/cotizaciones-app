import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que valida si el usuario tiene un rol específico
 * 
 * @example
 * // En routes:
 * canActivate: [roleGuard(['Owner'])]
 * canActivate: [roleGuard(['Owner', 'Administrativo'])]
 */
export const roleGuard = (requiredRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRoles = authService.userRoles();
    const hasRole = requiredRoles.some(role =>
      userRoles.some(ur => ur.nombreRol === role)
    );

    if (!hasRole) {
      console.warn(`❌ Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`);
      router.navigate(['/cotizaciones']);
      return false;
    }

    return true;
  };
};

/**
 * Guard que valida si el usuario tiene un permiso específico
 * 
 * @example
 * // En routes:
 * canActivate: [permissionGuard(['CREAR_COTIZACIONES'])]
 * canActivate: [permissionGuard(['MODIFICAR', 'APROBAR'])]
 */
export const permissionGuard = (requiredPermissions: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userPermissions = authService.userPermissions();
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.warn(`❌ Acceso denegado. Permisos requeridos: ${requiredPermissions.join(', ')}`);
      router.navigate(['/cotizaciones']);
      return false;
    }

    return true;
  };
};
