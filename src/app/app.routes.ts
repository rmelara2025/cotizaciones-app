import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/cmdb/pages/dashboard-recurrentes/dashboard-recurrentes').then(
        (m) => m.DashboardRecurrentes,
      ),
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./features/cmdb/pages/clientes-list/clientes-list').then(
        (m) => m.ClientesList,
      ),
  },
  {
    path: 'cotizaciones',
    loadChildren: () => import('./features/cmdb/cmdb-module').then((m) => m.CmdbModule),
  },
  {
    path: '',
    redirectTo: 'cotizaciones',
    pathMatch: 'full',
  },
];
