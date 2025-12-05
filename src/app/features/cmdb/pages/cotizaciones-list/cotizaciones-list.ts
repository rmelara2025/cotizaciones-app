import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { FieldsetModule } from 'primeng/fieldset';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ContratosService, IContrato } from '../../../../core/services/contratos.service';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { CotizacionDetalle } from '../cotizacion-detalle/cotizacion-detalle';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';
import { Table } from 'primeng/table'

@Component({
  selector: 'app-cotizaciones-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    CotizacionDetalle,
    FormatRutPipe,
    InputTextModule,
    FormsModule,
    SelectModule,
    RutInputDirective,
    InputGroupModule, InputGroupAddonModule,
    FieldsetModule
  ],
  templateUrl: './cotizaciones-list.html',
  styleUrl: './cotizaciones-list.scss',
})
export class CotizacionesList implements OnInit {

  private router = inject(Router);
  private contratosService = inject(ContratosService);
  private cotizacionesService = inject(CotizacionesService);

  // Filtros del usuario
  filters = {
    rutCliente: '',
    nombreCliente: '',
    codChi: '',
    codSap: '',
    codSison: '',
    estado: 'todos'  // vigente | expira | expirado | todos
  };


  // UI state for dialog
  showDetalleDialog = false;
  selectedRow: IContrato | null = null;

  get contratos() {
    return this.contratosService.contratos();
  }

  get loading() {
    return this.contratosService.loading();
  }

  get error() {
    return this.contratosService.error();
  }

  get totalRecords() {
    return this.contratosService.totalRecords();
  }

  get pageSize() {
    return this.contratosService.pageSize();
  }

  ngOnInit() {
    console.log('🚀 CotizacionesList component initialized');
    this.contratosService.loadContratos(0, 10, 'fechaInicio', 'asc', this.filters);
    console.log('📞 loadContratos called');
  }

  onPageChange(event: any) {
    // event.first = índice del primer registro
    // event.rows = tamaño de página
    const page = Math.floor(event.first / event.rows);
    console.log('📄 Page changed:', { first: event.first, rows: event.rows, page });
    this.contratosService.loadContratos(page, event.rows, event.sortField, event.sortOrder === 1 ? 'asc' : 'desc', this.filters);
  }

  verDetalle(contrato: IContrato) {
    // Open dialog with detalle component inside
    console.log('👁️ Opening detalle dialog for idContrato:', contrato?.idContrato);
    console.log('📦 Full contrato object:', contrato);
    this.selectedRow = contrato;
    this.showDetalleDialog = true;
  }

  closeDetalle() {
    this.showDetalleDialog = false;
    this.selectedRow = null;
    // Reset the service signals for next use
    this.cotizacionesService.cotizacionDetalle.set([]);
    this.cotizacionesService.error.set(null);
  }

  // Helper to return first non-empty project code
  projectCode(row: IContrato): string | null {
    if (!row) return null;
    return row.codChi || row.codSison || row.codSap || null;
  }

  // use UTC midnight to avoid timezone/DST issues
  private parseLocalDate(dateString: string): Date {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);   // <-- sin UTC, sin timezone shift
  }

  daysUntilExpiry(row: IContrato): number | null {
    if (!row?.fechaTermino) return null;
    try {
      const term = this.parseLocalDate(row.fechaTermino);
      const termUTC = Date.UTC(term.getFullYear(), term.getMonth(), term.getDate());

      const now = new Date();
      const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

      const diffMs = termUTC - nowUTC;
      const msPerDay = 24 * 60 * 60 * 1000;
      //const diffDays = Math.round((startTermUtc - startNowUtc) / msPerDay);

      return Math.round(diffMs / msPerDay);  // OJO → ahora usamos Math.round()
    } catch (e) {
      console.warn('daysUntilExpiry error', e);
      return null;
    }
  }



  expirySeverity(row: IContrato): 'high' | 'medium' | 'low' | null {
    const d = this.daysUntilExpiry(row);
    if (d === null) return null;

    if (d < 0) return 'high';       // ya expirado → high
    if (d === 0) return 'high';     // expira hoy -> tratar como alto
    //if (d <= 31) return 'high';
    if (d <= 120) return 'medium';
    //if (d <= 180) return 'low';
    return 'low';
  }

  getExpiryTooltip(row: any): string {
    const days = this.daysUntilExpiry(row);
    if (days == null) return 'Sin fecha';
    if (days < 0) return `Expirado hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return 'Expira hoy';
    return `Expira en ${days} día${days === 1 ? '' : 's'}`;
  }


  expiryBg(row: IContrato): string | null {
    const sev = this.expirySeverity(row);
    if (sev === 'high') return '#f8d7da'; // light red
    if (sev === 'medium') return '#fff3cd'; // light orange
    if (sev === 'low') return '#d1e7dd'; // light yellow
    return '#fff';
  }


  buscar() {

    this.contratosService.loadContratos(
      0,
      10,
      'fechaInicio',
      'asc',
      this.filters
    );
  }


}

