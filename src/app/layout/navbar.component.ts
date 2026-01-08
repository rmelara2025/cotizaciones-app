import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
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
              styleClass="mr-2"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

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
}
