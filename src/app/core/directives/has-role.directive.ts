import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural para mostrar/ocultar elementos basados en roles
 * 
 * @example
 * <button *hasRole="'Administrativo'">Editar</button>
 * <div *hasRole="['Owner', 'Administrativo']">...</div>
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

  @Input() set hasRole(roles: string | string[]) {
    effect(() => {
      const userRoles = this.authService.userRoles();
      const hasRole = this.checkRole(roles, userRoles);

      if (hasRole && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasRole && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  private checkRole(required: string | string[], userRoles: any[]): boolean {
    if (Array.isArray(required)) {
      // Si es array, el usuario debe tener AL MENOS UNO (OR)
      return required.some(role => userRoles.some(ur => ur.nombreRol === role));
    }
    // Si es string, verificar ese rol específico
    return userRoles.some(ur => ur.nombreRol === required);
  }
}
