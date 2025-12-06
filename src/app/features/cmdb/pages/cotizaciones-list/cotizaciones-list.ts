import { Component, OnInit, inject, ViewChild } from '@angular/core';
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
import { ExpiryService } from '../../../../core/services/expiry.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { CotizacionDetalle } from '../cotizacion-detalle/cotizacion-detalle';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';
import { ContratoFilters, DEFAULT_CONTRATO_FILTERS } from '../../../../core/models/filter.model';
import { Totals, EMPTY_TOTALS } from '../../../../core/models/totals.model';
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
  @ViewChild('dt') table?: Table;

  private contratosService = inject(ContratosService);
  private cotizacionesService = inject(CotizacionesService);
  private expiryService = inject(ExpiryService);
  private currencyService = inject(CurrencyService);

  // Typed filters
  filters: ContratoFilters = { ...DEFAULT_CONTRATO_FILTERS };

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

  // dentro de CotizacionesList
  get totalRecurrenteGlobal(): number {
    return this.contratosService.totalRecurrenteGlobal();
  }



  ngOnInit() {
    // Carga inicial: la tabla + totales en paralelo para mejor rendimiento
    this.cargarTablayTotales(0, 10);
  }

  /**
   * Carga simultáneamente la tabla paginada y los totales globales
   * Se usa en ngOnInit y cuando el usuario cambia filtros
   */
  private cargarTablayTotales(page: number, size: number) {
    // Cargar tabla paginada
    this.contratosService.loadContratos(page, size, 'fechaInicio', 'asc', this.filters);

    // Cargar todos los datos para totales (sin esperar a que termine la tabla)
    // El servicio devuelve un observable; nos suscribimos y recalculamos cuando termina
    this.contratosService.cargarTodosParaTotales('fechaInicio', 'asc', this.filters)
      .subscribe({
        next: () => {
          this.recalcularTotales();
        },
        error: (err) => {
          console.error('❌ Error cargando todosParaTotales desde componente:', err);
        }
      });
  }

  onPageChange(event: any) {
    // event.first = índice del primer registro
    // event.rows = tamaño de página
    const page = Math.floor(event.first / event.rows);
    // Solo cargar la tabla (los totales no cambian cuando cambias de página)
    this.contratosService.loadContratos(page, event.rows, event.sortField, event.sortOrder === 1 ? 'asc' : 'desc', this.filters);
  }

  verDetalle(contrato: IContrato) {
    // Open dialog with detalle component inside
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

  /**
   * Get expiry days count
   */
  daysUntilExpiry(row: IContrato): number | null {
    return this.expiryService.getDaysUntilExpiry(row?.fechaTermino);
  }

  /**
   * Get expiry severity level
   */
  expirySeverity(row: IContrato): 'high' | 'medium' | 'low' | null {
    const days = this.daysUntilExpiry(row);
    return this.expiryService.getSeverity(days);
  }

  /**
   * Get expiry tooltip message
   */
  getExpiryTooltip(row: IContrato): string {
    const days = this.daysUntilExpiry(row);
    return this.expiryService.getTooltip(days);
  }

  /**
   * Get expiry background color
   */
  expiryBg(row: IContrato): string | null {
    const severity = this.expirySeverity(row);
    return this.expiryService.getBackgroundColor(severity);
  }

  /**
   * Format currency amount according to type
   */
  convertCurrency(row: IContrato): string {
    const amount = typeof row?.totalRecurrente === 'number'
      ? row.totalRecurrente
      : Number(row?.totalRecurrente) || 0;

    return this.currencyService.format(amount, row?.nombreTipoMoneda);
  }

  /**
   * Handle search button click
   */
  buscar() {
    // Reset del paginator
    this.table?.reset();
    // Cargar tabla + totales en paralelo. Run in microtask to ensure ngModel updates applied
    Promise.resolve().then(() => this.cargarTablayTotales(0, 10));
  }

  /**
   * Handler para cambios en el select 'estado'
   */
  onEstadoChange(newValue: any) {
    this.filters.estado = newValue;
    // Run in microtask to avoid race with template/model propagation
    Promise.resolve().then(() => this.cargarTablayTotales(0, 10));
  }

  totalesPorMoneda: { [moneda: string]: number } = {};
  totalRecurrenteFiltrado: number = 0;

  /**
   * Recalcula los totales por moneda leyendo la señal `todosParaTotales`
   */
  private recalcularTotales() {
    // Leer de todosParaTotales, NO de contratos
    // contratos es solo los 10 registros paginados de la tabla
    // todosParaTotales contiene TODOS los registros para calcular totales correctos
    const rows = this.contratosService.todosParaTotales();

    // Total global
    this.totalRecurrenteFiltrado = rows.reduce((acc, r) => {
      const val = Number(r.totalRecurrente) || 0;
      return acc + val;
    }, 0);

    // Totales por moneda
    const mapa: { [m: string]: number } = {};

    rows.forEach(r => {
      const m = r.nombreTipoMoneda;
      const val = Number(r.totalRecurrente) || 0;
      if (!mapa[m]) mapa[m] = 0;
      mapa[m] += val;
    });

    this.totalesPorMoneda = mapa;
  }
}

