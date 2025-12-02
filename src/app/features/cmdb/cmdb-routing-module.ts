import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CotizacionesList } from './pages/cotizaciones-list/cotizaciones-list';
import { CotizacionDetalle } from './pages/cotizacion-detalle/cotizacion-detalle';

const routes: Routes = [
  { path: '', component: CotizacionesList },
  { path: ':id', component: CotizacionDetalle }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CmdbRoutingModule { }
