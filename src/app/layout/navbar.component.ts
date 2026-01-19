import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
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
    <p-menubar [model]="items">
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

  items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      command: () => this.router.navigate(['/dashboard']),
    },
    {
      label: 'Cotizaciones',
      icon: 'pi pi-fw pi-file',
      command: () => this.router.navigate(['/cotizaciones']),
    },
    {
      label: 'Clientes',
      icon: 'pi pi-fw pi-users',
      command: () => this.router.navigate(['/clientes']),
    },
    {
      label: 'Contactos',
      icon: 'pi pi-fw pi-address-book',
      command: () => this.router.navigate(['/contactos']),
    },
    {
      label: 'Reportes',
      icon: 'pi pi-fw pi-chart-bar',
    },
    {
      label: 'Configuración',
      icon: 'pi pi-fw pi-cog',
    },
  ];

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
