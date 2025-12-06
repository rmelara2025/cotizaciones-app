import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  // Chart.js data/options
  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};

  // Table summary
  summary: SummaryRow[] = [];

  // Constants for colors and labels
  private readonly monedasOrder = ['CLP', 'USD', 'UF'];
  private readonly estados = ['expirado', 'por-expirar', 'vigente'];
  private readonly estadoLabels: Record<string, string> = {
    'expirado': 'Expirado',
    'por-expirar': 'Por expirar',
    'vigente': 'Vigente'
  };
  private readonly colors: Record<string, string> = {
    'expirado': 'rgba(220,53,69,0.8)',
    'por-expirar': 'rgba(255,193,7,0.85)',
    'vigente': 'rgba(40,167,69,0.85)'
  };

  // current metric: 'totalRecurrente' or 'countContratos'
  metric: 'totalRecurrente' | 'countContratos' = 'totalRecurrente';

  ngOnInit(): void {
    this.dashboardService.getContratosDashboard().subscribe({
      next: (rows: DashboardContrato[]) => {
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
      if (!agg[mon]) agg[mon] = {};
      if (!agg[mon][est]) agg[mon][est] = { totalRecurrente: 0, countContratos: 0 };
      agg[mon][est].totalRecurrente += Number(total || 0);
      agg[mon][est].countContratos += Number(cnt || 0);
    }

    // Ensure labels in fixed order and only those three currencies
    const monedas = this.monedasOrder.slice();

    const buildDatasets = (metric: 'totalRecurrente' | 'countContratos') => {
      return this.estados.map(estado => {
        const data = monedas.map(mon => {
          const v = agg[mon] && agg[mon][estado] ? agg[mon][estado][metric] : 0;
          return Number(v || 0);
        });
        return {
          label: this.estadoLabels[estado] || estado,
          backgroundColor: this.colors[estado],
          data
        };
      });
    };

    // Build initial chart and summary
    const chartPayload = { labels: monedas, datasets: buildDatasets('totalRecurrente') };
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
      this.cdr.markForCheck();
    }, 0);
  }

  // Toggle metric and rebuild datasets
  toggleMetric(metric: 'totalRecurrente' | 'countContratos') {
    this.metric = metric;
    // Rebuild chart datasets with the new metric
    const monedas = this.monedasOrder.slice();

    // Rebuild aggregation from summary rows
    const agg: Record<string, Record<string, { totalRecurrente: number; countContratos: number }>> = {};
    for (const s of this.summary) {
      const mon = s.moneda;
      const est = s.estado === 'Por expirar' ? 'por-expirar' : s.estado.toLowerCase();
      if (!agg[mon]) agg[mon] = {};
      agg[mon][est] = { totalRecurrente: s.totalRecurrente, countContratos: s.countContratos };
    }

    const buildDatasets = (m: 'totalRecurrente' | 'countContratos') => {
      return this.estados.map(estado => {
        const data = monedas.map(mon => {
          const v = agg[mon] && agg[mon][estado] ? agg[mon][estado][m] : 0;
          return Number(v || 0);
        });
        return {
          label: this.estadoLabels[estado] || estado,
          backgroundColor: this.colors[estado],
          data
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
