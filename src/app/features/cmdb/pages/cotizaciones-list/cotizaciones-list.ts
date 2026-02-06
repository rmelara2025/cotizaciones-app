import { Component, OnInit, inject, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { DrawerModule } from 'primeng/drawer';
import { ContratosService } from '../../../../core/services/contratos.service';
import { AuthService } from '../../../../core/services/auth.service';

import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { ExpiryService } from '../../../../core/services/expiry.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { DashboardService } from '../../../../core/services/dashboard.service';

import { CotizacionesPorContrato } from '../cotizaciones-por-contrato/cotizaciones-por-contrato';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';
import { cleanRut } from '../../../../core/utils/rut.utils';
import {
  IContrato,
  IContratoFilters,
  DEFAULT_CONTRATO_FILTER,
  ITotals,
  EMPTY_TOTALS,
} from '../../../../core/models';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-cotizaciones-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    FormatRutPipe,
    InputTextModule,
    FormsModule,
    SelectModule,
    RutInputDirective,
    InputGroupModule,
    InputGroupAddonModule,
    FieldsetModule,
    DrawerModule,
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
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Typed filters
  filters: IContratoFilters = { ...DEFAULT_CONTRATO_FILTER };

  // Permisos
  canCreateContract = computed(() => this.authService.can('CREAR_COTIZACIONES'));
  canExportExcel = computed(() => this.authService.can('EXPORTAR_REPORTES'));

  // UI state for dialog
  showDetalleDialog = false;
  selectedRow: IContrato | null = null;
  showResumenDrawer = false;

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

  // Getters para el resumen de recurrentes
  get resumenRecurrentes() {
    return this.dashboardService.resumenRecurrentes();
  }

  get loadingResumen() {
    return this.dashboardService.loadingResumen();
  }

  /**
   * Retorna los datos de resumen agrupados por moneda con subtotales
   */
  get resumenConSubtotales() {
    const items = this.resumenRecurrentes;
    if (!items || items.length === 0) {
      return [];
    }

    const result: any[] = [];
    const groupedByMoneda: { [key: string]: any[] } = {};

    // Agrupar por tipo de moneda
    items.forEach(item => {
      const moneda = item.nombreTipoMoneda;
      if (!groupedByMoneda[moneda]) {
        groupedByMoneda[moneda] = [];
      }
      groupedByMoneda[moneda].push(item);
    });

    // Construir array con items + subtotales
    Object.keys(groupedByMoneda).forEach(moneda => {
      const grupo = groupedByMoneda[moneda];

      // Agregar todos los items del grupo
      grupo.forEach(item => result.push(item));

      // Calcular subtotal
      const subtotalContratos = grupo.reduce((sum, item) => sum + (item.cantidadContratos || 0), 0);
      const subtotalRecurrente = grupo.reduce((sum, item) => sum + (item.totalRecurrente || 0), 0);

      // Agregar fila de subtotal
      result.push({
        isSubtotal: true,
        nombreTipoMoneda: moneda,
        estado: '',
        cantidadContratos: subtotalContratos,
        totalRecurrente: subtotalRecurrente,
      });
    });

    return result;
  }

  /**
   * Formatea un valor numérico según el tipo de moneda
   * - CLP: sin decimales, punto como separador de miles (ej: 1.000.000)
   * - UF: 2 decimales, punto como separador de miles, coma para decimales (ej: 1.000,00)
   * - USD: 2 decimales, punto como separador de miles, coma para decimales (ej: 1.000,00)
   */
  formatCurrency(value: number, moneda: string): string {
    if (value == null || isNaN(value)) {
      return '0';
    }

    const tipoMoneda = (moneda || '').toUpperCase();

    if (tipoMoneda === 'CLP') {
      // Sin decimales, punto como separador de miles
      return Math.round(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else if (tipoMoneda === 'UF' || tipoMoneda === 'USD') {
      // 2 decimales, punto como separador de miles, coma para decimales
      const partes = value.toFixed(2).split('.');
      const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const decimal = partes[1];
      return `${entero},${decimal}`;
    } else {
      // Formato genérico por defecto
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  }

  // dentro de CotizacionesList
  get totalRecurrenteGlobal(): number {
    return this.contratosService.totalRecurrenteGlobal();
  }

  ngOnInit() {
    // Suscribirse a cambios en query params para mantener filtros al volver
    this.route.queryParams.subscribe(queryParams => {
      let hayFiltros = false;
      const nuevosFiltros = { ...DEFAULT_CONTRATO_FILTER };

      if (queryParams['rutCliente']) {
        nuevosFiltros.rutCliente = queryParams['rutCliente'];
        hayFiltros = true;
      }
      if (queryParams['nombreCliente']) {
        nuevosFiltros.nombreCliente = queryParams['nombreCliente'];
        hayFiltros = true;
      }
      if (queryParams['estado'] && queryParams['estado'] !== 'todos') {
        nuevosFiltros.estado = queryParams['estado'];
        hayFiltros = true;
      }
      if (queryParams['codChi']) {
        nuevosFiltros.codChi = queryParams['codChi'];
        hayFiltros = true;
      }
      if (queryParams['codSison']) {
        nuevosFiltros.codSison = queryParams['codSison'];
        hayFiltros = true;
      }
      if (queryParams['codSap']) {
        nuevosFiltros.codSap = queryParams['codSap'];
        hayFiltros = true;
      }

      // Aplicar filtros
      this.filters = nuevosFiltros;

      if (hayFiltros) {
        this.cargarTablayTotales(0, 10);
        this.cargarResumenConFiltros();
      } else {
        this.cargarTablayTotales(0, 10);
        // Cargar resumen sin filtros cuando no hay filtros aplicados
        this.dashboardService.loadResumenRecurrentes();
      }
    });
  }

  /**
   * Carga simultáneamente la tabla paginada y los totales globales
   * Se usa en ngOnInit y cuando el usuario cambia filtros
   */
  private cargarTablayTotales(page: number, size: number) {
    // Limpiar el RUT antes de enviar (remover puntos, mantener guion)
    const filtrosLimpios = { ...this.filters };
    if (filtrosLimpios.rutCliente) {
      filtrosLimpios.rutCliente = cleanRut(filtrosLimpios.rutCliente);
    }
    // Cargar tabla paginada
    this.contratosService.loadContratos(page, size, 'fechaInicio', 'asc', filtrosLimpios);
  }

  onPageChange(event: any) {
    // event.first = índice del primer registro
    // event.rows = tamaño de página
    const page = Math.floor(event.first / event.rows);
    // Limpiar el RUT antes de enviar
    const filtrosLimpios = { ...this.filters };
    if (filtrosLimpios.rutCliente) {
      filtrosLimpios.rutCliente = cleanRut(filtrosLimpios.rutCliente);
    }
    // Solo cargar la tabla (los totales no cambian cuando cambias de página)
    this.contratosService.loadContratos(
      page,
      event.rows,
      event.sortField,
      event.sortOrder === 1 ? 'asc' : 'desc',
      filtrosLimpios,
    );
  }

  verDetalle(contrato: IContrato) {
    // Guardar contrato en sessionStorage para persistencia
    sessionStorage.setItem('contrato-actual', JSON.stringify(contrato));

    // Navegar a la página de cotizaciones por contrato, pasando filtros actuales como query params
    const queryParams: any = {};
    if (this.filters.rutCliente) queryParams.rutCliente = this.filters.rutCliente;
    if (this.filters.nombreCliente) queryParams.nombreCliente = this.filters.nombreCliente;
    if (this.filters.estado && this.filters.estado !== 'todos') queryParams.estado = this.filters.estado;
    if (this.filters.codChi) queryParams.codChi = this.filters.codChi;
    if (this.filters.codSison) queryParams.codSison = this.filters.codSison;
    if (this.filters.codSap) queryParams.codSap = this.filters.codSap;

    this.router.navigate(['/cotizaciones/por-contrato', contrato.idContrato], {
      queryParams,
      state: { contrato: contrato }
    });
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
   * Handle search button click
   */
  buscar() {
    // Reset del paginator
    this.table?.reset();
    // Cargar tabla + totales en paralelo. Run in microtask to ensure ngModel updates applied
    Promise.resolve().then(() => {
      this.cargarTablayTotales(0, 10);
      // Cargar resumen con filtros
      this.cargarResumenConFiltros();
    });
  }

  /**
   * Handler para cambios en el select 'estado'
   */
  onEstadoChange(newValue: any) {
    this.filters.estado = newValue;
    // Run in microtask to avoid race with template/model propagation
    Promise.resolve().then(() => {
      this.cargarTablayTotales(0, 10);
      this.cargarResumenConFiltros();
    });
  }



  /**
   * Carga el resumen de recurrentes aplicando filtros
   */
  private cargarResumenConFiltros() {
    const filterPayload: any = {};

    // Preparar el payload según los filtros aplicados
    if (this.filters.rutCliente) {
      // Remover puntos del RUT, mantener solo el guion
      filterPayload.rut = cleanRut(this.filters.rutCliente);
    }

    if (this.filters.nombreCliente) {
      filterPayload.nombre = this.filters.nombreCliente;
    }

    // Si hay filtros, pasar el objeto; si no, pasar undefined para traer universo completo
    const hasFilters = Object.keys(filterPayload).length > 0;

    console.log('🔍 Cargando resumen con filtros:', hasFilters ? filterPayload : 'sin filtros');
    this.dashboardService.loadResumenRecurrentes(hasFilters ? filterPayload : undefined);
  }

  // totalesPorMoneda: { [moneda: string]: number } = {};
  totalRecurrenteFiltrado: number = 0;





  limpiarFiltros() {
    this.filters = { ...DEFAULT_CONTRATO_FILTER };
    this.table?.reset();
    this.cargarTablayTotales(0, this.pageSize);
    // Cargar resumen sin filtros (universo completo)
    this.dashboardService.loadResumenRecurrentes();
  }

  irAlWizard() {
    this.router.navigate(['/cotizaciones/wizard-contrato']);
  }

}
