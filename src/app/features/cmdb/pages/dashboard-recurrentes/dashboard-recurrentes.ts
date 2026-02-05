import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { FamiliaService } from '../../../../core/services/familia.service';
import { CatalogosService } from '../../../../core/services/catalogos.service';
import { IDashboardContrato } from '../../../../core/models';

interface ISummaryRow {
  moneda: string;
  estado: string;
  totalRecurrente: number;
  countContratos: number;
}

@Component({
  selector: 'app-dashboard-recurrentes',
  standalone: true,
  imports: [CommonModule, ChartModule, TableModule, CardModule, ButtonModule, SelectModule, FormsModule],
  templateUrl: './dashboard-recurrentes.html',
  styleUrl: './dashboard-recurrentes.scss',
})
export class DashboardRecurrentes implements OnInit {
  private dashboardService = inject(DashboardService);
  private familiaService = inject(FamiliaService);
  private catalogosService = inject(CatalogosService);
  private cdr = inject(ChangeDetectorRef);

  // Filtros
  idFamiliaServicioSelected: number | null = null;
  idServicioSelected: number | null = null;
  familias: any[] = [];
  servicios: any[] = [];
  serviciosFiltrados: any[] = [];

  // Chart.js data/options
  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};

  constructor() {
    // Effect para reaccionar automáticamente cuando cambian los datos del signal
    effect(() => {
      const data = this.dashboardService.resumenRecurrentes();
      console.log('effect triggered - data length:', data.length);
      // Siempre procesar, incluso si no hay datos (para limpiar la vista)
      this.process(data as any);
      this.cdr.detectChanges();
    });
  }

  // Table summary
  summary: ISummaryRow[] = [];

  // Constants for colors and labels
  private readonly monedasOrder = ['CLP', 'USD', 'UF'];
  private readonly estados = ['expirado', 'por-expirar', 'vigente'];
  private readonly estadoLabels: Record<string, string> = {
    expirado: 'Expirado',
    'por-expirar': 'Por expirar',
    vigente: 'Vigente',
  };
  private readonly colors: Record<string, string> = {
    expirado: 'rgba(220,53,69,0.8)',
    'por-expirar': 'rgba(255,193,7,0.85)',
    vigente: 'rgba(40,167,69,0.85)',
  };

  // current metric: 'totalRecurrente' or 'countContratos'
  metric: 'totalRecurrente' | 'countContratos' = 'totalRecurrente';

  /**
   * Retorna los datos de resumen agrupados por moneda con subtotales
   */
  get summaryConSubtotales() {
    if (!this.summary || this.summary.length === 0) {
      return [];
    }

    const result: any[] = [];
    const groupedByMoneda: { [key: string]: any[] } = {};

    // Agrupar por tipo de moneda
    this.summary.forEach(item => {
      const moneda = item.moneda;
      if (!groupedByMoneda[moneda]) {
        groupedByMoneda[moneda] = [];
      }
      groupedByMoneda[moneda].push(item);
    });

    // Construir array con items + subtotales y porcentajes
    Object.keys(groupedByMoneda).forEach(moneda => {
      const grupo = groupedByMoneda[moneda];

      // Calcular subtotal primero para porcentajes
      const subtotalContratos = grupo.reduce((sum, item) => sum + (item.countContratos || 0), 0);
      const subtotalRecurrente = grupo.reduce((sum, item) => sum + (item.totalRecurrente || 0), 0);

      // Agregar todos los items del grupo con su porcentaje
      grupo.forEach(item => {
        const porcentaje = subtotalRecurrente > 0
          ? (item.totalRecurrente / subtotalRecurrente) * 100
          : 0;
        result.push({
          ...item,
          porcentaje: porcentaje,
        });
      });

      // Agregar fila de subtotal
      result.push({
        isSubtotal: true,
        moneda: moneda,
        estado: '',
        totalRecurrente: subtotalRecurrente,
        countContratos: subtotalContratos,
        porcentaje: 100, // El subtotal siempre es 100%
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

  ngOnInit(): void {
    // Cargar familias para el dropdown
    this.familiaService.getFamilias().subscribe({
      next: (familias) => {
        setTimeout(() => {
          this.familias = [
            { label: 'Todas las Familias', value: null },
            ...familias.map(f => ({
              label: f.nombreFamilia,
              value: f.idFamilia
            }))
          ];
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error cargando familias:', error);
      }
    });

    // Cargar servicios para el dropdown
    this.catalogosService.listarServicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
      },
      error: (error) => {
        console.error('Error cargando servicios:', error);
      }
    });

    // Cargar datos iniciales sin filtro
    this.loadDashboardData();

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true },
      },
    };
  }

  loadDashboardData(): void {
    const filter: any = {};

    if (this.idFamiliaServicioSelected !== null && this.idFamiliaServicioSelected !== undefined) {
      filter.idFamiliaServicio = this.idFamiliaServicioSelected;
    }

    if (this.idServicioSelected !== null && this.idServicioSelected !== undefined) {
      filter.idServicio = this.idServicioSelected;
    }

    // Si no hay filtros, pasar undefined para cargar todo el universo
    const hasFilters = Object.keys(filter).length > 0;
    console.log('loadDashboardData - hasFilters:', hasFilters, 'filter:', filter);

    // El effect() se encargará de procesar los datos cuando el signal cambie
    this.dashboardService.loadResumenRecurrentes(hasFilters ? filter : undefined);
  }

  onFamiliaChange(): void {
    // Resetear el servicio seleccionado cuando cambia la familia
    this.idServicioSelected = null;

    // Actualizar la lista de servicios filtrados
    if (this.idFamiliaServicioSelected !== null && this.idFamiliaServicioSelected !== undefined) {
      this.serviciosFiltrados = this.servicios.filter(s => s.idFamilia === this.idFamiliaServicioSelected);
    } else {
      // Cuando se selecciona "Todas las Familias" o se limpia, mostrar todos los servicios
      this.serviciosFiltrados = [...this.servicios];
    }

    // Forzar detección de cambios y recargar datos
    this.cdr.detectChanges();
    setTimeout(() => this.loadDashboardData(), 0);
  }

  onServicioChange(): void {
    // Forzar detección de cambios y recargar datos
    this.cdr.detectChanges();
    setTimeout(() => this.loadDashboardData(), 0);
  }

  private process(rows: IDashboardContrato[]) {
    // Aggregate rows by moneda and estado (in case API returns multiple rows)
    const agg: Record<
      string,
      Record<string, { totalRecurrente: number; countContratos: number }>
    > = {};
    for (const r of rows) {
      // accept different possible property names returned by API
      const monRaw = (r as any).moneda ?? (r as any).nombreTipoMoneda ?? '';
      const mon = (monRaw || '').toString().trim().toUpperCase();
      const est = (r as any).estado ?? (r as any).estadoContratacion ?? '';
      // support different count property names: countContratos or cantidadContratos
      const cnt = (r as any).countContratos ?? (r as any).cantidadContratos ?? 0;
      const total = (r as any).totalRecurrente ?? (r as any).monto ?? 0;
      if (!agg[mon]) agg[mon] = {};
      if (!agg[mon][est]) agg[mon][est] = { totalRecurrente: 0, countContratos: 0 };
      agg[mon][est].totalRecurrente += Number(total || 0);
      agg[mon][est].countContratos += Number(cnt || 0);
    }

    // Ensure labels in fixed order and only those three currencies
    const monedas = this.monedasOrder.slice();

    // Ensure all 3 estados exist for each moneda (Option B - always show 3 categories)
    for (const mon of monedas) {
      if (!agg[mon]) agg[mon] = {};
      for (const est of this.estados) {
        if (!agg[mon][est]) {
          agg[mon][est] = { totalRecurrente: 0, countContratos: 0 };
        }
      }
    }

    const buildDatasets = (metric: 'totalRecurrente' | 'countContratos') => {
      return this.estados.map((estado) => {
        const data = monedas.map((mon) => {
          const v = agg[mon] && agg[mon][estado] ? agg[mon][estado][metric] : 0;
          return Number(v || 0);
        });
        return {
          label: this.estadoLabels[estado] || estado,
          backgroundColor: this.colors[estado],
          data,
        };
      });
    };

    // Build initial chart and summary
    const chartPayload = { labels: monedas, datasets: buildDatasets('totalRecurrente') };
    const summaryRows: ISummaryRow[] = [];
    for (const mon of monedas) {
      for (const est of this.estados) {
        const found =
          agg[mon] && agg[mon][est] ? agg[mon][est] : { totalRecurrente: 0, countContratos: 0 };
        summaryRows.push({
          moneda: mon,
          estado: this.estadoLabels[est] || est,
          totalRecurrente: found.totalRecurrente,
          countContratos: found.countContratos,
        });
      }
    }

    setTimeout(() => {
      this.chartData = chartPayload;
      this.summary = summaryRows;
      this.cdr.markForCheck();
    }, 0);
  }

  // Toggle metric and rebuild datasets
  toggleMetric(metric: 'totalRecurrente' | 'countContratos') {
    this.metric = metric;
    // Rebuild chart datasets with the new metric
    const monedas = this.monedasOrder.slice();

    // Rebuild aggregation from summary rows
    const agg: Record<
      string,
      Record<string, { totalRecurrente: number; countContratos: number }>
    > = {};
    for (const s of this.summary) {
      const mon = s.moneda;
      const est = s.estado === 'Por expirar' ? 'por-expirar' : s.estado.toLowerCase();
      if (!agg[mon]) agg[mon] = {};
      agg[mon][est] = { totalRecurrente: s.totalRecurrente, countContratos: s.countContratos };
    }

    const buildDatasets = (m: 'totalRecurrente' | 'countContratos') => {
      return this.estados.map((estado) => {
        const data = monedas.map((mon) => {
          const v = agg[mon] && agg[mon][estado] ? agg[mon][estado][m] : 0;
          return Number(v || 0);
        });
        return {
          label: this.estadoLabels[estado] || estado,
          backgroundColor: this.colors[estado],
          data,
        };
      });
    };

    // Update chart immediately with new metric
    setTimeout(() => {
      this.chartData = { labels: monedas, datasets: buildDatasets(metric) };
      this.cdr.markForCheck();
    }, 0);
  }
}
