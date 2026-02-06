import { Component, ChangeDetectionStrategy, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, MenubarModule, AvatarModule, ButtonModule],
  template: `
    <p-menubar [model]="items()">
      <ng-template pTemplate="end">
        @if (currentUser()) {
          <div class="flex align-items-center gap-2">
            <p-avatar
              [label]="getUserInitials()"
              shape="circle"
              styleClass="mr-2 cursor-pointer"
              (mouseenter)="mostrarRoles()"
              title="Ver roles del usuario"
            />
            <span class="mr-3">{{ currentUser()?.nombreUsuario || currentUser()?.email }}</span>
            <p-button
              label="Cerrar Sesión"
              icon="pi pi-sign-out"
              (onClick)="logout()"
              severity="danger"
              [text]="true"
            />
          </div>
        }
      </ng-template>
    </p-menubar>
  `,
  styles: [`
    :host ::ng-deep .roles-toast .p-toast-message-content {
      white-space: pre-line;
    }
    
    :host ::ng-deep .p-avatar.cursor-pointer:hover {
      transform: scale(1.1);
      transition: transform 0.2s;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  currentUser = this.authService.currentUser;
  userRoles = this.authService.userRoles;
  userPermissions = this.authService.userPermissions;

  // Computed para verificar permisos por rol
  canSeeDashboard = computed(() => this.authService.can('VER_DASHBOARD'));
  canSeeReports = computed(() => this.authService.can('VER_REPORTES'));
  // Configuración visible si puede ver Familias de Servicios O Gestionar Usuarios
  canSeeConfig = computed(() =>
    this.authService.can('VER_FAMILIA_SERVICIOS') || this.authService.can('GESTIONAR_USUARIOS')
  );

  // Ítems del menú filtrados por permisos
  items = computed<MenuItem[]>(() => {
    const menuItems: MenuItem[] = [];

    // Dashboard - Solo si tiene permiso
    if (this.canSeeDashboard()) {
      menuItems.push({
        label: 'Dashboard',
        icon: 'pi pi-fw pi-home',
        command: () => this.router.navigate(['/dashboard']),
      });
    }

    // Cotizaciones - Todos los roles pueden ver
    menuItems.push({
      label: 'Cotizaciones',
      icon: 'pi pi-fw pi-file',
      command: () => this.router.navigate(['/cotizaciones']),
    });

    // Clientes - Todos los roles pueden ver
    menuItems.push({
      label: 'Clientes',
      icon: 'pi pi-fw pi-users',
      command: () => this.router.navigate(['/clientes']),
    });

    // Contactos - Oculto para rol "Vista"
    if (this.authService.hasAnyPermission(['VER_TODO', 'GESTIONAR_CLIENTES', 'VER_CLIENTES'])) {
      menuItems.push({
        label: 'Contactos',
        icon: 'pi pi-fw pi-address-book',
        command: () => this.router.navigate(['/contactos']),
      });
    }

    // Reportes - Dividido según permisos
    const reporteItems: MenuItem[] = [];

    // Cadencia de Ingresos - Owner, Gerencial, VIP (NO Administrativo)
    if (this.authService.can('VER_CADENCIA')) {
      reporteItems.push({
        label: 'Cadencia de Ingresos',
        icon: 'pi pi-fw pi-chart-line',
        command: () => this.router.navigate(['/reportes/cadencia-ingresos']),
      });
    }

    // Otros reportes podrían ir aquí en el futuro

    // Solo mostrar menú de Reportes si hay items disponibles
    if (reporteItems.length > 0) {
      menuItems.push({
        label: 'Reportes',
        icon: 'pi pi-fw pi-chart-bar',
        items: reporteItems,
      });
    }

    // Configuración - Solo Owner y algunos roles
    if (this.canSeeConfig()) {
      const configItems: MenuItem[] = [];

      // Familias y Servicios - Visible para Owner y Administrativo
      if (this.authService.can('VER_FAMILIA_SERVICIOS')) {
        configItems.push({
          label: 'Familias y Servicios',
          icon: 'pi pi-fw pi-sitemap',
          command: () => this.router.navigate(['/config/familias-servicios']),
        });
      }

      // Usuarios - Solo Owner
      if (this.authService.hasRole('Owner')) {
        configItems.push({
          label: 'Usuarios',
          icon: 'pi pi-fw pi-users',
          command: () => this.router.navigate(['/config/usuarios']),
        });
      }

      if (configItems.length > 0) {
        menuItems.push({
          label: 'Configuración',
          icon: 'pi pi-fw pi-cog',
          items: configItems,
        });
      }
    }

    return menuItems;
  });

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';

    if (user.nombreUsuario) {
      const parts = user.nombreUsuario.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    if (user.idUsuario) {
      return user.idUsuario.substring(0, 2).toUpperCase();
    }

    return '??';
  }

  logout(): void {
    this.authService.logout();
  }

  mostrarRoles(): void {
    const roles = this.userRoles();

    if (roles.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Roles del Usuario',
        detail: 'No se encontraron roles asignados',
        life: 3000,
        key: 'rolesNotification'
      });
      return;
    }

    // Crear lista de roles con viñetas para mejor visualización
    const rolesLista = roles.map(rol => `• ${rol.nombreRol}`).join('\n');

    this.messageService.add({
      severity: 'info',
      summary: `Roles del Usuario (${roles.length})`,
      detail: rolesLista,
      life: 5000,
      key: 'rolesNotification',
      styleClass: 'roles-toast'
    });
  }
}
