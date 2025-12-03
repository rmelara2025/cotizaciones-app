import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ContratosService, IContrato } from '../../../../core/services/contratos.service';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { CotizacionDetalle } from '../cotizacion-detalle/cotizacion-detalle';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { validarRut } from '../../../../core/pipes/rut.validator';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';

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
    RutInputDirective
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
    estado: ''  // vigente | expira | expirado
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
    this.contratosService.loadContratos(0, 10, 'fechaInicio', 'desc', this.filters);
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

  // Returns true when the contract's fechaTermino is within `days` days from today (inclusive)
  isNearExpiry(row: IContrato, days = 90): boolean {
    try {
      const term = row?.fechaTermino ? new Date(row.fechaTermino) : null;
      if (!term) return false;
      const now = new Date();
      // clear time portion for consistent day calculations
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((term.getTime() - now.getTime()) / msPerDay);
      return diffDays >= 0 && diffDays <= days;
    } catch (e) {
      console.warn('isNearExpiry error', e);
      return false;
    }
  }

  // Returns the number of days until expiry (can be negative if already expired). Null if no fechaTermino.
  daysUntilExpiry(row: IContrato): number | null {
    if (!row?.fechaTermino) return null;
    try {
      const term = new Date(row.fechaTermino);
      const now = new Date();
      // normalize to start of day for stable diff in days
      const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startTerm = new Date(term.getFullYear(), term.getMonth(), term.getDate()).getTime();
      const msPerDay = 1000 * 60 * 60 * 24;
      return Math.ceil((startTerm - startNow) / msPerDay);
    } catch (e) {
      console.warn('daysUntilExpiry error', e);
      return null;
    }
  }

  // 'high' = <=30 days, 'medium' = <=120, 'low' = <=180, null = not near expiry
  expirySeverity(row: IContrato): 'high' | 'medium' | 'low' | null {
    const d = this.daysUntilExpiry(row);
    if (d === null) return null;
    if (d < 0) return 'high'; // already expired treat as high
    if (d <= 31) return 'high';
    if (d <= 120) return 'medium';
    if (d <= 180) return 'low';
    return null;
  }

  expiryBg(row: IContrato): string | null {
    const sev = this.expirySeverity(row);
    if (sev === 'high') return '#f8d7da'; // light red
    if (sev === 'medium') return '#ffe5b4'; // light orange
    if (sev === 'low') return '#fff3cd'; // light yellow
    return null;
  }

  getExpiryTooltip(row: any): string {
    const days = this.daysUntilExpiry(row);

    if (days == null) {
      return 'Sin fecha';
    }

    return days < 0
      ? `Expirado hace ${Math.abs(days)} días`
      : `Expira en ${days} días`;
  }

  buscar() {
    this.contratosService.loadContratos(
      0,
      this.pageSize,
      'fechaInicio',
      'desc',
      this.filters
    );
  }


}

