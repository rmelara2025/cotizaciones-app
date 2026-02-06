import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import type { RoleAction } from '../config/role-permissions.config';

/**
 * Directiva estructural para mostrar/ocultar elementos basados en roles.
 * Soporta tanto acciones definidas en ROLE_PERMISSIONS como nombres de roles directos.
 * 
 * @example
 * ```html
 * <!-- Usando una acción definida en ROLE_PERMISSIONS (RECOMENDADO) -->
 * <button *hasRole="'EXPORTAR_REPORTES'">Exportar</button>
 * <button *hasRole="'CREAR_COTIZACIONES'">Nueva Cotización</button>
 * 
 * <!-- Usando nombres de roles directamente -->
 * <div *hasRole="'Owner'">Solo Owner</div>
 * <div *hasRole="['Owner', 'Administrativo']">Owner o Admin</div>
 * ```
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;
  
  // Signal para manejar el input reactivamente
  private actionOrRoleSignal = signal<RoleAction | string | string[] | null>(null);

  constructor() {
    // Effect creado en el constructor (contexto de inyección válido)
    effect(() => {
      const actionOrRole = this.actionOrRoleSignal();
      if (!actionOrRole) return;

      const hasAccess = this.checkAccess(actionOrRole);

      if (hasAccess && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasAccess && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  @Input() set hasRole(actionOrRole: RoleAction | string | string[]) {
    // Simplemente actualizar el signal, el effect se encarga del resto
    this.actionOrRoleSignal.set(actionOrRole);
  }

  private checkAccess(actionOrRole: RoleAction | string | string[]): boolean {
    if (Array.isArray(actionOrRole)) {
      // Array de nombres de roles: verificar si tiene alguno
      return this.authService.hasAnyRole(actionOrRole);
    }

    // Intentar como acción primero (ej: 'EXPORTAR_REPORTES')
    // Si está en ROLE_PERMISSIONS, usar can()
    if (this.isRoleAction(actionOrRole)) {
      return this.authService.can(actionOrRole as RoleAction);
    }

    // Si no, tratarlo como nombre de rol directo (ej: 'Owner')
    return this.authService.hasRole(actionOrRole);
  }

  private isRoleAction(action: string): boolean {
    // Verificar si la acción está definida en ROLE_PERMISSIONS
    // Las acciones están en UPPERCASE con guiones bajos
    return action === action.toUpperCase() && action.includes('_');
  }
}
