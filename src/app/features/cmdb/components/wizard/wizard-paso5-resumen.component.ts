import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { WizardService } from '../../services/wizard.service';
import { ContratosService } from '../../../../core/services/contratos.service';
import { CotizacionesService } from '../../../../core/services/cotizaciones.service';
import { IndicadoresService } from '../../../../core/services/indicadores.service';
import { CatalogosService } from '../../../../core/services/catalogos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { MessageService } from 'primeng/api';
import { formatDateForBackend, formatDateForItemBackend } from '../../../../core/utils/date.utils';

@Component({
  selector: 'app-wizard-paso5-resumen',
  imports: [
    CommonModule,
    ButtonModule,
    PanelModule,
    DividerModule,
    MessageModule,
    FormatRutPipe
  ],
  providers: [MessageService],
  template: `
    <div class="wizard-paso wizard-paso5">
      <h3 class="mb-4">Resumen y Confirmación</h3>

      <p class="text-color-secondary mb-4">
        Revise todos los datos antes de confirmar. Una vez creado, 
        el contrato y la cotización quedarán en estado BORRADOR.
      </p>

      <!-- Resumen del Contrato -->
      <p-panel header="Contrato" [toggleable]="false" styleClass="mb-3">
        @if (wizardService.esNuevoContrato()) {
          @if (wizardService.contratoNuevo(); as contrato) {
            <div class="grid">
              <div class="col-12 md:col-6">
                <label class="block text-sm font-semibold text-500 mb-1">Cliente</label>
                <p class="m-0 text-lg">{{ contrato.cliente?.nombreCliente }}</p>
                <p class="m-0 text-sm text-color-secondary">
                  RUT: {{ contrato.cliente?.rutCliente | formatRut }}
                </p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold text-500 mb-1">Código Proyecto</label>
                <p class="m-0">
                  <span class="font-semibold">{{ contrato.tipoCodigoProyecto }}:</span>
                  {{ contrato.codigoProyecto }}
                </p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold text-500 mb-1">Vigencia</label>
                <p class="m-0">
                  {{ contrato.fechaInicio | date: 'dd/MM/yyyy' }}<br/>
                  {{ contrato.fechaTermino | date: 'dd/MM/yyyy' }}
                </p>
              </div>
            </div>
          }
        } @else {
          @if (wizardService.contratoExistente(); as contrato) {
            <div class="grid">
              <div class="col-12 md:col-6">
                <label class="block text-sm font-semibold text-500 mb-1">Cliente</label>
                <p class="m-0 text-lg">{{ contrato.nombreCliente }}</p>
                <p class="m-0 text-sm text-color-secondary">
                  RUT: {{ contrato.rutCliente | formatRut }}
                </p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold text-500 mb-1">Código Proyecto</label>
                <p class="m-0">{{ contrato.codSap || contrato.codChi || contrato.codSison }}</p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold text-500 mb-1">Vigencia</label>
                <p class="m-0">
                  {{ contrato.fechaInicio | date: 'dd/MM/yyyy' }}<br/>
                  {{ contrato.fechaTermino | date: 'dd/MM/yyyy' }}
                </p>
              </div>
            </div>
          }
        }
      </p-panel>

      <!-- Resumen de la Cotización -->
      <p-panel header="Cotización" [toggleable]="false" styleClass="mb-3">
        @if (wizardService.cotizacion(); as cot) {
          <div class="grid">
            <div class="col-12 md:col-4">
              <label class="block text-sm font-semibold text-500 mb-1">Versión</label>
              <p class="m-0">1 (Primera cotización)</p>
            </div>
            <div class="col-12 md:col-4">
              <label class="block text-sm font-semibold text-500 mb-1">Vigencia Desde</label>
              <p class="m-0">{{ cot.fechaVigenciaDesde | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="col-12 md:col-4">
              <label class="block text-sm font-semibold text-500 mb-1">Vigencia Hasta</label>
              <p class="m-0">{{ cot.fechaVigenciaHasta | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="col-12">
              <label class="block text-sm font-semibold text-500 mb-1">Observación</label>
              <p class="m-0">{{ cot.observacion || 'Sin observaciones' }}</p>
            </div>
          </div>
        }
      </p-panel>

      <!-- Resumen de Items -->
      <p-panel header="Items de Servicio" [toggleable]="true" styleClass="mb-3">
        <div class="items-resumen">
          @for (item of wizardService.items(); track item.numItem) {
            <div class="item-card p-3 mb-2 surface-card border-round">
              <div class="grid align-items-center">
                <div class="col-12 md:col-4">
                  <span class="font-semibold">{{ item.nombreServicio }}</span>
                  <span class="text-sm text-color-secondary ml-2">({{ item.nombreFamilia }})</span>
                </div>
                <div class="col-6 md:col-2">
                  <span class="text-sm text-500">Cantidad:</span> {{ item.cantidad }}
                </div>
                <div class="col-6 md:col-2">
                  <span class="text-sm text-500">Precio Unit.:</span> {{ item.precioUnitario | number: '1.2-2' }}
                </div>
                <div class="col-6 md:col-2">
                  <span class="text-sm text-500">Moneda:</span> {{ getNombreMoneda(item.idTipoMoneda) }}
                </div>
                <div class="col-6 md:col-2 text-right">
                  <div class="text-sm text-500">Subtotal:</div>
                  <div class="font-semibold">{{ item.cantidad * item.precioUnitario | number: '1.2-2' }} {{ getNombreMoneda(item.idTipoMoneda) }}</div>
                </div>
              </div>
            </div>
          }
          <p-divider />
          <div class="flex justify-content-end align-items-center gap-3">
            <span class="text-xl font-semibold">TOTAL (CLP):</span>
            <span class="text-2xl font-bold text-green-600">
              {{ calcularTotal() | number: '1.0-0' }}
            </span>
          </div>
        </div>

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
      </p-panel>

      @if (error()) {
        <p-message severity="error" [text]="error()!" styleClass="w-full mb-3" />
      }

      <!-- Botones -->
      <div class="flex justify-content-between gap-2 mt-4">
        <p-button
          label="Atrás"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="onAtras()"
          [disabled]="guardando()"
        />
        <p-button
          label="Confirmar y Crear"
          icon="pi pi-check"
          iconPos="right"
          (onClick)="onConfirmar()"
          [loading]="guardando()"
        />
      </div>
    </div>
  `,
  styles: [`
    .wizard-paso5 {
      padding: 2rem;
    }

    .item-card {
      border: 1px solid var(--surface-border);
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
    }

    .indicadores-nota {
      background-color: var(--blue-50);
      border-left: 4px solid var(--primary-color);
    }

    :host ::ng-deep {
      .p-panel-header {
        background-color: var(--primary-color);
        color: white;
      }
    }
  `]
})
export class WizardPaso5ResumenComponent {
  wizardService = inject(WizardService);
  private contratosService = inject(ContratosService);
  private cotizacionesService = inject(CotizacionesService);
  private indicadoresService = inject(IndicadoresService);
  private catalogosService = inject(CatalogosService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  guardando = signal(false);
  error = signal<string | null>(null);

  valorDolar = this.indicadoresService.valorDolar;
  valorUF = this.indicadoresService.valorUF;
  fechaDolar = this.indicadoresService.fechaDolar;
  fechaUF = this.indicadoresService.fechaUF;
  monedas = this.catalogosService.monedas;

  /**
   * Obtiene el nombre de la moneda por su ID
   */
  getNombreMoneda(idTipoMoneda: number): string {
    const moneda = this.monedas().find(m => m.idTipoMoneda === idTipoMoneda);
    return moneda?.codigo || '';
  }

  /**
   * Calcula el total general en pesos (sumando todos los items convertidos)
   */
  calcularTotal(): number {
    return this.wizardService.items().reduce((sum, item) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const subtotalEnPesos = this.indicadoresService.convertirAPesos(subtotal, item.idTipoMoneda);
      return sum + subtotalEnPesos;
    }, 0);
  }

  onAtras(): void {
    this.wizardService.pasoAnterior();
  }

  async onConfirmar(): Promise<void> {
    this.guardando.set(true);
    this.error.set(null);

    try {
      let idContrato: string;

      // 1. Crear o usar contrato existente
      if (this.wizardService.esNuevoContrato()) {
        const contratoNuevo = this.wizardService.contratoNuevo();
        if (!contratoNuevo || !contratoNuevo.cliente) throw new Error('Datos del contrato no disponibles');

        // Crear contrato en backend
        console.log('📝 Creando contrato nuevo:', contratoNuevo);
        const contratoCreado = await this.contratosService.crearContrato({
          rutCliente: contratoNuevo.cliente.rutCliente,
          tipoCodigoProyecto: contratoNuevo.tipoCodigoProyecto,
          codigoProyecto: contratoNuevo.codigoProyecto,
          fechaInicio: formatDateForBackend(contratoNuevo.fechaInicio!),
          fechaTermino: formatDateForBackend(contratoNuevo.fechaTermino!),
          observacion: 'Contrato creado desde wizard'
        });
        idContrato = contratoCreado.idContrato;
        console.log('✅ Contrato creado:', idContrato);
      } else {
        const contratoExistente = this.wizardService.contratoExistente();
        if (!contratoExistente) throw new Error('Contrato no seleccionado');
        idContrato = contratoExistente.idContrato;
      }

      // 2. Crear cotización
      const cotizacion = this.wizardService.cotizacion();
      if (!cotizacion) throw new Error('Datos de cotización no disponibles');

      const userId = this.authService.getCurrentUserId();
      if (!userId) throw new Error('Usuario no autenticado');

      const cotizacionCreada = await this.cotizacionesService.crearCotizacion({
        idContrato,
        idUsuarioCreacion: userId,
        fechaEmision: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        fechaVigenciaDesde: formatDateForBackend(cotizacion.fechaVigenciaDesde!),
        fechaVigenciaHasta: formatDateForBackend(cotizacion.fechaVigenciaHasta!),
        observacion: cotizacion.observacion
      });

      // 3. Guardar items
      const items = this.wizardService.items().map((item, idx) => ({
        numItem: idx + 1,
        idServicio: item.idServicio,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        idTipoMoneda: item.idTipoMoneda,
        idPeriodicidad: item.idPeriodicidad,
        fechaInicioFacturacion: formatDateForItemBackend(item.fechaInicioFacturacion),
        fechaFinFacturacion: formatDateForItemBackend(item.fechaFinFacturacion),
        atributos: item.atributos ? JSON.stringify(item.atributos) : null,
        observacion: item.observacion
      }));

      await this.cotizacionesService.guardarItems(cotizacionCreada.idCotizacion, items);

      // 4. Éxito
      this.wizardService.marcarCompletado();
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Contrato y cotización creados exitosamente'
      });

      // Navegar al detalle de la cotización
      setTimeout(() => {
        this.router.navigate(['/cotizaciones/cotizacion-detalle', cotizacionCreada.idCotizacion]);
        this.wizardService.resetear();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error creando contrato/cotización:', error);
      this.error.set(error?.message || 'Error al crear el contrato y cotización');
    } finally {
      this.guardando.set(false);
    }
  }
}
