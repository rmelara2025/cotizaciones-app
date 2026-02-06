import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/utils/auth.guard';
import { roleGuard, permissionGuard } from './core/utils/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/cmdb/pages/login/login').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/cmdb/pages/dashboard-recurrentes/dashboard-recurrentes').then(
        (m) => m.DashboardRecurrentes,
      ),
    canActivate: [authGuard, permissionGuard(['VER_DASHBOARD'])],
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./features/cmdb/pages/clientes-list/clientes-list').then(
        (m) => m.ClientesList,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'contactos',
    loadComponent: () =>
      import('./features/cmdb/pages/contactos-list/contactos-list').then(
        (m) => m.ContactosList,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'cotizaciones',
    loadChildren: () => import('./features/cmdb/cmdb-module').then((m) => m.CmdbModule),
    canActivate: [authGuard],
  },
  {
    path: 'reportes/cadencia-ingresos',
    loadComponent: () =>
      import('./features/cmdb/cadencia-ingresos/cadencia-ingresos.component').then(
        (m) => m.CadenciaIngresosComponent,
      ),
    canActivate: [authGuard, permissionGuard(['VER_REPORTES'])],
  },
  {
    path: 'config/usuarios',
    loadComponent: () =>
      import('./features/cmdb/pages/usuarios-list/usuarios-list').then(
        (m) => m.UsuariosList,
      ),
    canActivate: [authGuard, roleGuard(['Owner'])],
  },
  {
    path: 'config/familias-servicios',
    loadComponent: () =>
      import('./features/cmdb/pages/familias-servicios-list/familias-servicios-list').then(
        (m) => m.FamiliasServiciosList,
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
