import { Component, OnInit, Input, inject, ChangeDetectionStrategy, effect, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { IFamilia, IServicioFamilia, FamiliaService } from '../../../../core/services/familia.service';
import { ICotizacionDetalle } from '../../../../core/models';
import { CurrencyService } from '../../../../core/services/currency.service';

@Component({
  selector: 'app-cotizacion-detalle',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule, SelectModule, InputTextModule, DialogModule, FormsModule],
  templateUrl: './cotizacion-detalle.html',
  styleUrl: './cotizacion-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  protected cotizacionesService = inject(CotizacionesService);
  private familiaService = inject(FamiliaService);
  private currencyService = inject(CurrencyService);

  @Input() idContrato?: string;
  @Input() isModal = false;

  // Referencia al body del documento para appendTo
  body = document.body;

  id: string = '';
  lastPage: number = 0;

  rows = signal<ICotizacionDetalle[]>([]);
  editingId = signal<string | null>(null);
  editingRowData = signal<ICotizacionDetalle | null>(null);
  showEditModal = signal(false);
  saving = signal(false);
  familias = signal<IFamilia[]>([]);
  serviciosPorFamilia = signal<Record<number, IServicioFamilia[]>>({});

  // Computed signal para servicios actuales basado en la familia editada
  currentServicios = computed(() => {
    const row = this.editingRowData();
    if (!row || !row.idFamilia) return [];
    const servicios = this.serviciosPorFamilia()[row.idFamilia];
    return Array.isArray(servicios) ? servicios : [];
  });

  get detalle() {
    return this.rows();
  }

  editingRow(): ICotizacionDetalle | null {
    return this.editingRowData();
  }

  serviciosPor(idFamilia: number): IServicioFamilia[] {
    // Acceder al signal de servicios para mantener la reactividad
    const servicios = this.serviciosPorFamilia()[idFamilia];
    return Array.isArray(servicios) ? servicios : [];
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

      if (data && data.length >= 0) {
        this.rows.set(data);
        this.currentFirst = page * size;
      }
    });
  }
  ngOnInit() {
    if (this.idContrato) {
      this.id = this.idContrato;
      this.cotizacionesService.loadCotizacionDetalle(this.idContrato, 0, 10);
    } else {
      this.route.params.subscribe((params) => {
        const id = params['id'];
        this.id = id;
        if (id) {
          this.cotizacionesService.loadCotizacionDetalle(id, 0, 10);
        }
      });
    }
    this.loadFamilias();
  }

  private block = false;
  currentFirst = 0;

  onPageChange(event: any) {
    if (this.block) return;
    this.block = true;
    setTimeout(() => (this.block = false), 50);

    const page = Math.floor(event.first / event.rows);
    this.currentFirst = event.first;

    if (page === this.lastPage) {
      return;
    }

    this.lastPage = page;
    this.cotizacionesService.loadCotizacionDetalle(this.id, page, event.rows);
  }

  convertCurrency(row: ICotizacionDetalle): string {
    const amount =
      typeof row?.recurrente === 'number' ? row.recurrente : Number(row?.recurrente) || 0;

    return this.currencyService.format(amount, row?.nombreTipoMoneda);
  }

  addNewRow() {
    const currentRows = this.rows();
    const maxNum = currentRows.reduce((max, r) => Math.max(max, Number(r?.numItem) || 0), 0);
    const tempId = `new-${Date.now()}`;
    const baseMoneda = currentRows[0]?.nombreTipoMoneda || '';

    const newRow: ICotizacionDetalle = {
      idDetalle: tempId,
      numItem: maxNum + 1,
      versionCotizacion: 0,
      idContrato: this.id,
      idServicio: 0,
      cantidad: 1,
      recurrente: 0,
      atributos: {},
      nombreServicio: '',
      nombreFamilia: '',
      nombreTipoMoneda: baseMoneda,
      idFamilia: 0,
    } as ICotizacionDetalle;

    // NO agregar a la grilla todavía, solo preparar para editar
    this.editingId.set(tempId);
    this.loadFamilias();

    // Abrir el modal para editar la nueva fila
    this.editingRowData.set(newRow);
    setTimeout(() => {
      this.showEditModal.set(true);
    }, 100);
  }

  startEdit(row: ICotizacionDetalle) {
    this.editingId.set(row.idDetalle);
    // Hacer una copia profunda para evitar modificar el original
    const copy = JSON.parse(JSON.stringify(row));

    // Cargar familias si no están cargadas
    this.loadFamilias();


    // Cargar servicios para la familia actual ANTES de mostrar el modal
    this.loadServicios(row.idFamilia);


    this.editingRowData.set(copy);

    // Esperar a que las opciones se carguen antes de mostrar el modal
    setTimeout(() => {
      this.showEditModal.set(true);
    }, 100);
  }

  openEditModal(row: ICotizacionDetalle) {
    this.startEdit(row);
  }

  cancelEdit(row: ICotizacionDetalle | null) {
    this.showEditModal.set(false);
    // No hacer nada más, solo cerrar el modal
    // La fila nueva nunca fue agregada a la grilla
    this.editingId.set(null);
    this.editingRowData.set(null);
  }

  closeModal(visible: boolean) {
    if (!visible) {
      this.cancelEdit(this.editingRow());
    }
  }

  saveRow(row: ICotizacionDetalle | null) {
    if (!row) return;
    if (!row.idFamilia || !row.idServicio) {
      this.errorMessage('Debe seleccionar familia y servicio');
      return;
    }

    this.saving.set(true);

    // Para nuevos ítems usamos POST /api/cotizaciones
    // Para editar usamos PUT /api/cotizaciones/editar
    const request$ = row.idDetalle.startsWith('new-')
      ? this.cotizacionesService.createCotizacionItem({
        idContrato: this.id,
        idServicio: row.idServicio,
        cantidad: row.cantidad,
        recurrente: row.recurrente,
        atributos: '{}',
      })
      : this.cotizacionesService.updateCotizacionItem({
        idDetalle: row.idDetalle,
        numItem: row.numItem,
        idContrato: this.id,
        idServicio: row.idServicio,
        cantidad: row.cantidad,
        recurrente: row.recurrente,
        atributos: '{}',
      });

    request$.subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.editingId.set(null);
        this.editingRowData.set(null);

        // Si era una fila nueva, agregar a la grilla antes de refrescar
        if (row.idDetalle.startsWith('new-')) {
          const currentRows = this.rows();
          this.rows.set([...currentRows, row]);
        }

        this.refreshDetalle();
      },
      error: (err) => {
        console.error('❌ Error guardando detalle', err);
        this.saving.set(false);
      },
    });
  }

  deleteRow(row: ICotizacionDetalle) {
    if (row.idDetalle.startsWith('new-')) {
      this.rows.set(this.rows().filter((r) => r.idDetalle !== row.idDetalle));
      return;
    }

    this.cotizacionesService.deleteDetalle(this.id, row.idDetalle).subscribe({
      next: () => this.refreshDetalle(),
      error: (err) => console.error('❌ Error eliminando detalle', err),
    });
  }

  onFamiliaChange(row: ICotizacionDetalle, idFamilia: any) {
    const familiaId = Number(idFamilia);
    if (!familiaId) return;

    // Actualizar la familia
    row.idFamilia = familiaId;
    row.idServicio = 0;
    row.nombreServicio = '';

    const familia = this.familias().find((f) => f.idFamilia === familiaId);
    row.nombreFamilia = familia?.nombreFamilia || '';

    // IMPORTANTE: Forzar el update del signal para que la vista se actualice
    this.editingRowData.set({ ...row });

    // Cargar servicios para la nueva familia
    this.loadServicios(familiaId);
  }

  onServicioChange(row: ICotizacionDetalle, idServicio: any) {
    const servicioId = Number(idServicio);
    if (!servicioId) return;

    row.idServicio = servicioId;
    const servicio = this.serviciosPor(row.idFamilia || 0).find((s) => s.idServicio === servicioId);
    row.nombreServicio = servicio?.nombreServicio || '';

    // IMPORTANTE: Forzar el update del signal para reflejar cambios
    this.editingRowData.set({ ...row });
  }

  private loadFamilias() {
    if (this.familias().length) return;
    this.familiaService.getFamilias().subscribe((familias) => this.familias.set(familias));
  }

  private loadServicios(idFamilia: number) {
    if (!idFamilia) return;
    this.familiaService.getServiciosPorFamilia(idFamilia).subscribe({
      next: (servicios) => {
        const current = this.serviciosPorFamilia();
        this.serviciosPorFamilia.set({ ...current, [idFamilia]: servicios });
      },
      error: (err) => {
        console.error('Error loading servicios:', err);
        const current = this.serviciosPorFamilia();
        this.serviciosPorFamilia.set({ ...current, [idFamilia]: [] });
      }
    });
  }

  private refreshDetalle() {
    this.cotizacionesService.loadCotizacionDetalle(this.id, this.cotizacionesService.currentPage(), this.pageSize);
    this.saving.set(false);
  }

  private errorMessage(message: string) {
    this.cotizacionesService.error.set(message);
    console.error(message);
  }
}
