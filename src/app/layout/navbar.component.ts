import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MenubarModule],
  template: ` <p-menubar [model]="items"></p-menubar> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private router = inject(Router);

  items: MenuItem[] = [
    {
      label: 'Cotizaciones',
      icon: 'pi pi-fw pi-file',
      command: () => this.router.navigate(['/cotizaciones']),
    },
    {
      label: 'Clientes',
      icon: 'pi pi-fw pi-users',
    },
    {
      label: 'Proveedores',
      icon: 'pi pi-fw pi-box',
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
}
