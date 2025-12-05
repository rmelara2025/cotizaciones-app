import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardContrato } from '../../models/dashboard/dashboard.model';

interface SummaryRow {
  moneda: string;
  estado: string;
  totalRecurrente: number;
  countContratos: number;
}

@Component({
  selector: 'app-dashboard-recurrentes',
  standalone: true,
  imports: [CommonModule, ChartModule, TableModule, CardModule, ButtonModule],
  templateUrl: './dashboard-recurrentes.html',
  styleUrl: './dashboard-recurrentes.scss',
})
export class DashboardRecurrentes implements OnInit {
  private dashboardService = inject(DashboardService);

  // Chart.js data/options
  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};

  // Table summary
  summary: SummaryRow[] = [];

  // internal
  readonly monedasOrder = ['CLP', 'USD', 'UF'];
  private estados = ['expirado', 'por-expirar', 'vigente'];
  private estadoLabels: Record<string, string> = {
    'expirado': 'Expirado',
    'por-expirar': 'Por expirar',
    'vigente': 'Vigente'
  };

  // current metric: 'totalRecurrente' or 'countContratos'
  metric: 'totalRecurrente' | 'countContratos' = 'totalRecurrente';

  ngOnInit(): void {
    this.dashboardService.getContratosDashboard().subscribe({
      next: (rows: DashboardContrato[]) => {
        console.log('📡 Dashboard data received:', rows);
        this.process(rows);
      },
      error: (err) => console.error('Error loading dashboard data', err)
    });

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    };
  }

  private process(rows: DashboardContrato[]) {
    console.log('🔧 Processing dashboard rows:', rows && rows.length);
    // Aggregate rows by moneda and estado (in case API returns multiple rows)
    const agg: Record<string, Record<string, { totalRecurrente: number; countContratos: number }>> = {};
    for (const r of rows) {
      // accept different possible property names returned by API
      const monRaw = (r as any).moneda ?? (r as any).nombreTipoMoneda ?? '';
      const mon = (monRaw || '').toString().trim().toUpperCase();
      const est = (r as any).estado ?? (r as any).estadoContratacion ?? '';
      // support different count property names: countContratos or cantidadContratos
      const cnt = (r as any).countContratos ?? (r as any).cantidadContratos ?? 0;
      const total = (r as any).totalRecurrente ?? (r as any).monto ?? 0;
      console.log('  - row', { mon, est, totalRecurrente: total, countContratos: cnt });
      if (!agg[mon]) agg[mon] = {};
      if (!agg[mon][est]) agg[mon][est] = { totalRecurrente: 0, countContratos: 0 };
      agg[mon][est].totalRecurrente += Number(total || 0);
      agg[mon][est].countContratos += Number(cnt || 0);
    }
    console.log('  agg result:', agg);

    // Ensure labels in fixed order and only those three currencies
    const monedas = this.monedasOrder.slice();

    const colors: Record<string, string> = {
      'expirado': 'rgba(220,53,69,0.8)',
      'por-expirar': 'rgba(255,193,7,0.85)',
      'vigente': 'rgba(40,167,69,0.85)'
    };

    const buildDatasets = (metric: 'totalRecurrente' | 'countContratos') => {
      return this.estados.map(estado => {
        const data = monedas.map(mon => {
          const v = agg[mon] && agg[mon][estado] ? agg[mon][estado][metric] : 0;
          return Number(v || 0);
        });
        return {
          label: this.estadoLabels[estado] || estado,
          backgroundColor: colors[estado],
          data
        };
      });
    };

    // Assign to bindings on next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    const chartPayload = { labels: monedas, datasets: buildDatasets(this.metric) };
    const summaryRows: SummaryRow[] = [];
    for (const mon of monedas) {
      for (const est of this.estados) {
        const found = agg[mon] && agg[mon][est] ? agg[mon][est] : { totalRecurrente: 0, countContratos: 0 };
        summaryRows.push({
          moneda: mon,
          estado: this.estadoLabels[est] || est,
          totalRecurrente: found.totalRecurrente,
          countContratos: found.countContratos
        });
      }
    }

    setTimeout(() => {
      this.chartData = chartPayload;
      this.summary = summaryRows;
    }, 0);
  }

  // Toggle metric and rebuild datasets
  toggleMetric(metric: 'totalRecurrente' | 'countContratos') {
    this.metric = metric;
    // rebuild chart datasets based on existing summary/aggregation
    // Recreate a small rows array from summary to reuse process
    const rows: DashboardContrato[] = this.summary.map(s => ({ moneda: s.moneda, estado: s.estado === 'Por expirar' ? 'por-expirar' : s.estado.toLowerCase() as any, totalRecurrente: s.totalRecurrente, countContratos: s.countContratos }));
    this.process(rows);
  }
}
