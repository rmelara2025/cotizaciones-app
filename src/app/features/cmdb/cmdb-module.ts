import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CmdbRoutingModule } from './cmdb-routing-module';
import { RutInputDirective } from '../../core/pipes/rut-only.directive';

@NgModule({
  imports: [
    CommonModule,
    CmdbRoutingModule,
    RutInputDirective
  ]
})
export class CmdbModule { }
