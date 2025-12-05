import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CmdbRoutingModule } from './cmdb-routing-module';
import { RutInputDirective } from '../../core/pipes/rut-only.directive';
//import { DashboardRecurrentes } from './pages/dashboard-recurrentes/dashboard-recurrentes';

@NgModule({
  imports: [
    CommonModule,
    CmdbRoutingModule,
    RutInputDirective
  ],
  declarations: [
    //DashboardRecurrentes
  ]
})
export class CmdbModule { }
