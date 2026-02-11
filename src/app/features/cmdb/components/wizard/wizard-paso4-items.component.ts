import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { WizardService, IWizardItem } from '../../services/wizard.service';
import { CatalogosService, IProveedor } from '../../../../core/services/catalogos.service';
import { IndicadoresService } from '../../../../core/services/indicadores.service';

@Component({
  selector: 'app-wizard-paso4-items',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    InputTextModule,
    DialogModule,
    TextareaModule
  ],
  template: `
    <div class="wizard-paso wizard-paso4">
      <h3 class="mb-4">Items de Servicio</h3>

      <div class="flex justify-content-between align-items-center mb-3">
        <p class="text-sm text-color-secondary m-0">
          Agregue los servicios que formarán parte de esta cotización
        </p>
        <p-button
          label="Agregar Item"
          icon="pi pi-plus"
          size="small"
          (onClick)="agregarItem()"
        />
      </div>

      <!-- Tabla de Items -->
      <p-table
        [value]="items()"
        styleClass="p-datatable-sm"
        [scrollable]="true"
        scrollHeight="400px"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 50px">#</th>
            <th style="min-width: 200px">Servicio</th>
            <th style="width: 180px">Proveedor</th>
            <th style="width: 100px">Cantidad</th>
            <th style="width: 150px">Precio Unit.</th>
            <th style="width: 120px">Moneda</th>
            <th style="width: 150px">Periodicidad</th>
            <th style="width: 150px">Inicio Fact.</th>
            <th style="width: 150px">Fin Fact.</th>
            <th style="width: 120px">Subtotal</th>
            <th style="width: 100px">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
          <tr>
            <td>{{ rowIndex + 1 }}</td>
            <td>
              <p-select
                [(ngModel)]="item.idServicio"
                [options]="servicios()"
                optionLabel="nombre"
                optionValue="idServicio"
                placeholder="Seleccionar"
                (ngModelChange)="onServicioChange(item)"
                [filter]="true"
                filterBy="nombre"
                appendTo="body"
                class="w-full"
              />
            </td>
            <td>
              <p-select
                [(ngModel)]="item.idProveedor"
                [options]="item._proveedoresDisponibles || []"
                optionLabel="nombreProveedor"
                optionValue="idProveedor"
                placeholder="Seleccionar (opcional)"
                [showClear]="true"
                appendTo="body"
                class="w-full"
                [disabled]="!item.idServicio || !item._proveedoresDisponibles?.length"
                (ngModelChange)="onProveedorChange(item)"
              />
            </td>
            <td>
              <p-inputNumber
                [(ngModel)]="item.cantidad"
                [min]="1"
                [showButtons]="true"
                (ngModelChange)="calcularSubtotal(item)"
                class="w-full"
              />
            </td>
            <td>
              <p-inputNumber
                [(ngModel)]="item.precioUnitario"
                mode="decimal"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                (ngModelChange)="calcularSubtotal(item)"
                class="w-full"
              />
            </td>
            <td>
              <p-select
                [(ngModel)]="item.idTipoMoneda"
                [options]="monedas()"
                optionLabel="nombreTipoMoneda"
                optionValue="idTipoMoneda"
                placeholder="Moneda"
                appendTo="body"
                class="w-full"
              />
            </td>
            <td>
              <p-select
                [(ngModel)]="item.idPeriodicidad"
                [options]="periodicidades()"
                optionLabel="nombre"
                optionValue="idPeriodicidad"
                placeholder="Periodo"
                appendTo="body"
                class="w-full"
              />
            </td>
            <td>
              <p-datePicker
                [(ngModel)]="item.fechaInicioFacturacion"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                appendTo="body"
                class="w-full"
              />
            </td>
            <td>
              <p-datePicker
                [(ngModel)]="item.fechaFinFacturacion"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                [minDate]="item.fechaInicioFacturacion || undefined"
                appendTo="body"
                class="w-full"
              />
            </td>
            <td class="font-bold">
              {{ calcularSubtotalEnPesos(item) | number: '1.0-0' }} CLP
            </td>
            <td>
              <div class="flex gap-1">
                <p-button
                  icon="pi pi-pencil"
                  severity="info"
                  size="small"
                  [text]="true"
                  (onClick)="editarAtributos(item)"
                  pTooltip="Atributos"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  [text]="true"
                  (onClick)="eliminarItem(rowIndex)"
                  pTooltip="Eliminar"
                />
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="11" class="text-center p-4">
              No hay items agregados. Haga clic en "Agregar Item" para comenzar.
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="footer">
          <tr>
            <td colspan="9" class="text-right font-bold">TOTAL (CLP):</td>
            <td class="font-bold text-primary" style="font-size: 1.1rem">
              {{ calcularTotal() | number: '1.0-0' }}
            </td>
            <td></td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Nota de Indicadores -->
      <div class="indicadores-nota mt-3 p-3 surface-100 border-round">
        <div class="flex align-items-start gap-2">
          <i class="pi pi-info-circle text-primary" style="font-size: 1.2rem; margin-top: 2px;"></i>
          <div class="flex-1">
            <p class="font-semibold mb-2 text-sm">Factores de Conversión a Pesos (CLP)</p>
            <div class="grid text-sm">
              <div class="col-12 md:col-6">
                <span class="font-semibold">Dólar (USD):</span> 
                @if (valorDolar() > 0) {
                  <span>{{ valorDolar() | number: '1.2-2' }} CLP ({{ fechaDolar() }})</span>
                } @else {
                  <span class="text-color-secondary">Cargando...</span>
                }
              </div>
              <div class="col-12 md:col-6">
                <span class="font-semibold">UF:</span>
                @if (valorUF() > 0) {
                  <span>{{ valorUF() | number: '1.2-2' }} CLP ({{ fechaUF() }})</span>
                } @else {
                  <span class="text-color-secondary">Cargando...</span>
                }
              </div>
            </div>
            <p class="text-xs text-color-secondary mt-2 mb-0">
              * Los subtotales en dólares y UF se convierten automáticamente a pesos usando estos valores.
            </p>
          </div>
        </div>
      </div>

      <!-- Dialog de Atributos/Observación -->
      <p-dialog
        header="Atributos y Observación"
        [(visible)]="mostrarDialogAtributos"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        @if (itemEditando()) {
          <div class="flex flex-column gap-3">
            <div>
              <label class="block mb-2 font-semibold">Observación</label>
              <textarea
                pTextarea
                [(ngModel)]="itemEditando()!.observacion"
                rows="3"
                class="w-full"
                placeholder="Detalles adicionales del item..."
              ></textarea>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button
            label="Cerrar"
            icon="pi pi-check"
            (onClick)="cerrarDialogAtributos()"
          />
        </ng-template>
      </p-dialog>

      <!-- Botones -->
      <div class="flex justify-content-between gap-2 mt-4">
        <p-button
          label="Atrás"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="onAtras()"
        />
        <p-button
          label="Siguiente"
          icon="pi pi-arrow-right"
          iconPos="right"
          (onClick)="onSiguiente()"
          [disabled]="!formularioValido()"
        />
      </div>
    </div>
  `,
  styles: [`
    .wizard-paso4 {
      padding: 2rem;
    }

    .indicadores-nota {
      background-color: var(--blue-50);
      border-left: 4px solid var(--primary-color);
    }

    :host ::ng-deep {
      .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.5rem;
      }

      .p-inputnumber input,
      .p-select {
        font-size: 0.875rem;
      }
    }
  `]
})
export class WizardPaso4ItemsComponent implements OnInit {
  private wizardService = inject(WizardService);
  private catalogosService = inject(CatalogosService);
  private indicadoresService = inject(IndicadoresService);

  items = signal<IWizardItem[]>([]);

  servicios = this.catalogosService.servicios;
  monedas = this.catalogosService.monedas;
  periodicidades = this.catalogosService.periodicidades;

  valorDolar = this.indicadoresService.valorDolar;
  valorUF = this.indicadoresService.valorUF;
  fechaDolar = this.indicadoresService.fechaDolar;
  fechaUF = this.indicadoresService.fechaUF;

  mostrarDialogAtributos = false;
  itemEditando = signal<IWizardItem | null>(null);

  ngOnInit(): void {
    // Cargar catálogos e indicadores
    this.catalogosService.loadServicios();
    this.catalogosService.loadMonedas();
    this.catalogosService.loadPeriodicidades();
    this.indicadoresService.cargarIndicadores();

    // Cargar items existentes si los hay
    const itemsExistentes = this.wizardService.items();
    if (itemsExistentes && itemsExistentes.length > 0) {
      this.items.set([...itemsExistentes]);
    }
  }

  agregarItem(): void {
    const nuevoItem: IWizardItem = {
      numItem: this.items().length + 1,
      idServicio: 0,
      nombreServicio: '',
      nombreFamilia: '',
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0,
      idTipoMoneda: 0,
      nombreMoneda: '',
      idPeriodicidad: 0,
      nombrePeriodicidad: '',
      fechaInicioFacturacion: null,
      fechaFinFacturacion: null,
      atributos: null,
      observacion: '',
      idProveedor: undefined,
      nombreProveedor: undefined,
      _proveedoresDisponibles: [] as IProveedor[]
    };
    this.items.update(items => [...items, nuevoItem]);
  }

  eliminarItem(index: number): void {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  onServicioChange(item: IWizardItem): void {
    const servicio = this.servicios().find((s: any) => s.idServicio === item.idServicio);
    if (servicio) {
      item.nombreServicio = servicio.nombre;
      item.nombreFamilia = servicio.nombreFamilia || '';

      // Reiniciar proveedor cuando cambia el servicio
      item.idProveedor = undefined;
      item.nombreProveedor = undefined;
      item._proveedoresDisponibles = [] as IProveedor[];

      // Cargar proveedores del servicio
      this.catalogosService.obtenerProveedoresPorServicio(item.idServicio).subscribe({
        next: (proveedores) => {
          item._proveedoresDisponibles = proveedores;
        },
        error: (err) => {
          console.error('Error cargando proveedores del servicio:', err);
          item._proveedoresDisponibles = [] as IProveedor[];
        }
      });
    }
  }

  onProveedorChange(item: IWizardItem): void {
    if (item.idProveedor) {
      const proveedor = item._proveedoresDisponibles?.find((p: any) => p.idProveedor === item.idProveedor);
      if (proveedor) {
        item.nombreProveedor = proveedor.nombreProveedor;
      }
    } else {
      // Si se limpia el proveedor
      item.nombreProveedor = undefined;
    }
  }

  calcularSubtotal(item: IWizardItem): void {
    item.subtotal = item.cantidad * item.precioUnitario;
  }

  /**
   * Calcula el subtotal de un item convertido a pesos
   */
  calcularSubtotalEnPesos(item: IWizardItem): number {
    const subtotal = item.cantidad * item.precioUnitario;
    return this.indicadoresService.convertirAPesos(subtotal, item.idTipoMoneda);
  }

  /**
   * Calcula el total general en pesos (sumando todos los items convertidos)
   */
  calcularTotal(): number {
    return this.items().reduce((sum, item) => {
      const subtotalEnPesos = this.calcularSubtotalEnPesos(item);
      return sum + subtotalEnPesos;
    }, 0);
  }

  editarAtributos(item: IWizardItem): void {
    this.itemEditando.set(item);
    this.mostrarDialogAtributos = true;
  }

  cerrarDialogAtributos(): void {
    this.mostrarDialogAtributos = false;
    this.itemEditando.set(null);
  }

  formularioValido(): boolean {
    const items = this.items();
    return items.length > 0 && items.every(item =>
      item.idServicio > 0 &&
      item.cantidad > 0 &&
      item.precioUnitario > 0 &&
      item.idTipoMoneda > 0 &&
      item.idPeriodicidad > 0
    );
  }

  onAtras(): void {
    this.wizardService.pasoAnterior();
  }

  onSiguiente(): void {
    if (!this.formularioValido()) return;

    // Guardar items en el servicio
    this.wizardService.setItems(this.items());
  }
}
