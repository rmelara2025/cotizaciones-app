import { Component, OnInit, Input, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CotizacionesService, CotizacionDetalle as ICotizacionDetalle } from '../../../../core/services/cotizaciones.service';
import { CurrencyService } from '../../../../core/services/currency.service';

@Component({
  selector: 'app-cotizacion-detalle',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule],
  templateUrl: './cotizacion-detalle.html',
  styleUrl: './cotizacion-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CotizacionDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  protected cotizacionesService = inject(CotizacionesService);
  private currencyService = inject(CurrencyService);

  @Input() idContrato?: string;
  @Input() isModal = false;
  id: string = '';
  lastPage: number = 0;

  get detalle() {
    return this.cotizacionesService.cotizacionDetalle();
  }

  get loading() {
    return this.cotizacionesService.loading();
  }

  get error() {
    return this.cotizacionesService.error();
  }
  get totalRecords() {
    return this.cotizacionesService.totalRecords();
  }

  get pageSize() {
    return this.cotizacionesService.pageSize();
  }
  constructor() {
    effect(() => {
      const page = this.cotizacionesService.currentPage();
      const size = this.cotizacionesService.pageSize();
      const data = this.cotizacionesService.cotizacionDetalle();

      // Solo recalcula si llegó data nueva
      if (data && data.length >= 0) {
        this.currentFirst = page * size;
      }
    });
  }
  ngOnInit() {
    // Si viene como Input (modal), usa ese ID
    if (this.idContrato) {
      this.id = this.idContrato;
      this.cotizacionesService.loadCotizacionDetalle(this.idContrato, 0, 10);
    } else {
      // Si viene por ruta, obtén el ID de los params
      this.route.params.subscribe((params) => {
        const id = params['id'];
        this.id = id;
        if (id) {
          this.cotizacionesService.loadCotizacionDetalle(id, 0, 10);
        }
      });
    }
  }

  private block = false;
  currentFirst = 0;

  onPageChange(event: any) {
    if (this.block) return;
    this.block = true;
    setTimeout(() => (this.block = false), 50);

    const page = Math.floor(event.first / event.rows);

    // Update first to reflect current page position
    this.currentFirst = event.first;

    if (page === this.lastPage) {
      return;
    }

    this.lastPage = page;
    console.log('📄 Page changed:', { first: event.first, rows: event.rows, page });
    this.cotizacionesService.loadCotizacionDetalle(this.id, page, event.rows);
  }

  convertCurrency(row: ICotizacionDetalle): string {
    const amount = typeof row?.recurrente === 'number'
      ? row.recurrente
      : Number(row?.recurrente) || 0;

    return this.currencyService.format(amount, row?.nombreTipoMoneda);
  }
}
