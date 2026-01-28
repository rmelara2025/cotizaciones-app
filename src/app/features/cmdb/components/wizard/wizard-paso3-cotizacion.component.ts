import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { WizardService, IWizardCotizacion } from '../../services/wizard.service';

@Component({
    selector: 'app-wizard-paso3-cotizacion',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DatePickerModule,
        TextareaModule
    ],
    template: `
    <div class="wizard-paso wizard-paso3">
      <h3 class="mb-4">Datos de la Cotización</h3>

      <!-- Info del Contrato (readonly) -->
      <div class="info-contrato mb-4 p-3 surface-card border-round">
        <h4 class="mb-2">Información del Contrato</h4>
        @if (wizardService.esNuevoContrato()) {
          @if (wizardService.contratoNuevo(); as contrato) {
            <div class="grid">
              <div class="col-12 md:col-6">
                <label class="block text-sm font-semibold mb-1">Cliente</label>
                <p class="m-0">{{ contrato.cliente?.nombreCliente }}</p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold mb-1">Código Proyecto</label>
                <p class="m-0">{{ contrato.codigoProyecto }}</p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold mb-1">Vigencia Contrato</label>
                <p class="m-0">
                  {{ contrato.fechaInicio | date: 'dd/MM/yyyy' }} - 
                  {{ contrato.fechaTermino | date: 'dd/MM/yyyy' }}
                </p>
              </div>
            </div>
          }
        } @else {
          @if (wizardService.contratoExistente(); as contrato) {
            <div class="grid">
              <div class="col-12 md:col-6">
                <label class="block text-sm font-semibold mb-1">Cliente</label>
                <p class="m-0">{{ contrato.nombreCliente }}</p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold mb-1">Código Proyecto</label>
                <p class="m-0">{{ contrato.codSap || contrato.codChi || contrato.codSison }}</p>
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm font-semibold mb-1">Vigencia Contrato</label>
                <p class="m-0">
                  {{ contrato.fechaInicio | date: 'dd/MM/yyyy' }} - 
                  {{ contrato.fechaTermino | date: 'dd/MM/yyyy' }}
                </p>
              </div>
            </div>
          }
        }
      </div>

      <!-- Datos de Cotización -->
      <div class="mb-4">
        <h4>Vigencia de la Cotización</h4>
        <p class="text-sm text-color-secondary mb-3">
          <i class="pi pi-info-circle mr-2"></i>
          Por defecto se usan las fechas del contrato, pero puedes modificarlas (ej: meses de gracia)
        </p>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="fechaDesde" class="block mb-2 font-semibold">
              Fecha Vigencia Desde <span class="text-red-500">*</span>
            </label>
            <p-datePicker
              id="fechaDesde"
              [(ngModel)]="fechaVigenciaDesde"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              placeholder="Seleccione fecha"
              appendTo="body"
              class="w-full"
            />
          </div>
          <div class="col-12 md:col-6">
            <label for="fechaHasta" class="block mb-2 font-semibold">
              Fecha Vigencia Hasta <span class="text-red-500">*</span>
            </label>
            <p-datePicker
              id="fechaHasta"
              [(ngModel)]="fechaVigenciaHasta"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              [minDate]="fechaVigenciaDesde || undefined"
              placeholder="Seleccione fecha"
              appendTo="body"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="mb-4">
        <label for="observacion" class="block mb-2 font-semibold">Observaciones</label>
        <textarea
          pTextarea
          id="observacion"
          [(ngModel)]="observacion"
          rows="3"
          placeholder="Creación de Contrato y Cotización por sistema"
          class="w-full"
        ></textarea>
      </div>

      <!-- Info adicional -->
      <div class="info-auto p-3 surface-100 border-round">
        <p class="m-0 text-sm">
          <i class="pi pi-info-circle mr-2"></i>
          <strong>Información automática:</strong> La cotización se creará como versión 1, 
          fecha de emisión será la actual, estado inicial BORRADOR, 
          número de cotización se generará automáticamente (COT-2026-00000XXX)
        </p>
      </div>

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
    .wizard-paso3 {
      padding: 2rem;
    }

    .info-contrato {
      border: 1px solid var(--surface-border);
    }

    h4 {
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    .info-auto {
      background-color: var(--blue-50);
      border-left: 4px solid var(--blue-500);
    }
  `]
})
export class WizardPaso3CotizacionComponent implements OnInit {
    wizardService = inject(WizardService);

    fechaVigenciaDesde: Date | null = null;
    fechaVigenciaHasta: Date | null = null;
    observacion = 'Creación de Contrato y Cotización por sistema';

    ngOnInit(): void {
        // Inicializar fechas con las del contrato
        if (this.wizardService.esNuevoContrato()) {
            const contrato = this.wizardService.contratoNuevo();
            if (contrato) {
                this.fechaVigenciaDesde = contrato.fechaInicio;
                this.fechaVigenciaHasta = contrato.fechaTermino;
            }
        } else {
            const contrato = this.wizardService.contratoExistente();
            if (contrato) {
                this.fechaVigenciaDesde = new Date(contrato.fechaInicio);
                this.fechaVigenciaHasta = new Date(contrato.fechaTermino);
            }
        }
    }

    formularioValido(): boolean {
        return !!(this.fechaVigenciaDesde && this.fechaVigenciaHasta);
    }

    onAtras(): void {
        this.wizardService.pasoAnterior();
    }

    onSiguiente(): void {
        if (!this.formularioValido()) return;

        const cotizacion: IWizardCotizacion = {
            fechaVigenciaDesde: this.fechaVigenciaDesde!,
            fechaVigenciaHasta: this.fechaVigenciaHasta!,
            observacion: this.observacion
        };

        this.wizardService.setCotizacion(cotizacion);
    }
}
