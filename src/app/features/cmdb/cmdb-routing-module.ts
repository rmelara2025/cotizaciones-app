import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CotizacionesList } from './pages/cotizaciones-list/cotizaciones-list';
import { CotizacionDetalle } from './pages/cotizacion-detalle/cotizacion-detalle';
import { DashboardRecurrentes } from './pages/dashboard-recurrentes/dashboard-recurrentes';
import { ClientesList } from './pages/clientes-list/clientes-list';

const routes: Routes = [
  { path: '', component: CotizacionesList },
  { path: 'clientes', component: ClientesList },
  { path: ':id', component: CotizacionDetalle },
  { path: 'dashboard', component: DashboardRecurrentes },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CmdbRoutingModule { }
