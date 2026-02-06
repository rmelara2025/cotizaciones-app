import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural para mostrar/ocultar elementos basados en permisos
 * 
 * @example
 * <button *hasPermission="'CREAR_COTIZACIONES'">Nueva Cotización</button>
 * <div *hasPermission="['MODIFICAR', 'APROBAR']">...</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;

  @Input() set hasPermission(permissions: string | string[]) {
    effect(() => {
      const userPermissions = this.authService.userPermissions();
      const hasPermission = this.checkPermission(permissions, userPermissions);

      if (hasPermission && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasPermission && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  private checkPermission(required: string | string[], userPermissions: string[]): boolean {
    if (Array.isArray(required)) {
      // Si es array, el usuario debe tener AL MENOS UNO (OR)
      return required.some(permission => userPermissions.includes(permission));
    }
    // Si es string, verificar ese permiso específico
    return userPermissions.includes(required);
  }
}
