import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { WizardService, IWizardCliente, IWizardContratoNuevo } from '../../services/wizard.service';
import { ClientesService } from '../../../../core/services/clientes.service';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';

@Component({
    selector: 'app-wizard-paso2-contrato-nuevo',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        InputGroupModule,
        MessageModule,
        SelectModule,
        DatePickerModule,
        FormatRutPipe,
        RutInputDirective
    ],
    template: `
    <div class="wizard-paso wizard-paso2">
      <h3 class="mb-4">Datos del Nuevo Contrato</h3>

      <!-- Buscar Cliente -->
      <div class="mb-4">
        <h4>1. Buscar Cliente</h4>
        <div class="grid">
          <div class="col-12 md:col-8">
            <label for="rut" class="block mb-2 font-semibold">RUT Cliente</label>
            <p-inputGroup>
              <input
                pInputText
                id="rut"
                [(ngModel)]="rutBusqueda"
                placeholder="12345678-9"
                appRutInput
                class="w-full"
              />
              <p-button
                icon="pi pi-search"
                (onClick)="buscarCliente()"
                [loading]="buscando()"
                [disabled]="!rutBusqueda"
              />
            </p-inputGroup>
          </div>
        </div>

        @if (errorBusqueda()) {
          <p-message severity="error" [text]="errorBusqueda()!" styleClass="mt-2 w-full" />
        }

        @if (cliente()) {
          <div class="cliente-info mt-3 p-3 surface-card border-round">
            <div class="grid">
              <div class="col-12 md:col-4">
                <label class="block text-sm font-semibold mb-1">RUT</label>
                <p class="m-0">{{ cliente()!.rutCliente | formatRut }}</p>
              </div>
              <div class="col-12 md:col-4">
                <label class="block text-sm font-semibold mb-1">Nombre</label>
                <p class="m-0">{{ cliente()!.nombreCliente }}</p>
              </div>
              <div class="col-12 md:col-4">
                <label class="block text-sm font-semibold mb-1">Razón Social</label>
                <p class="m-0">{{ cliente()!.razonSocial }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      @if (cliente()) {
        <!-- Código Proyecto -->
        <div class="mb-4">
          <h4>2. Código de Proyecto</h4>
          <div class="grid">
            <div class="col-12 md:col-4">
              <label for="tipoCodigo" class="block mb-2 font-semibold">Tipo</label>
              <p-select
                id="tipoCodigo"
                [(ngModel)]="tipoCodigoProyecto"
                [options]="tiposCodigo"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                appendTo="body"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-8">
              <label for="codigoProyecto" class="block mb-2 font-semibold">Código</label>
              <input
                pInputText
                id="codigoProyecto"
                [(ngModel)]="codigoProyecto"
                [placeholder]="getPlaceholderCodigo()"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Fechas del Contrato -->
        <div class="mb-4">
          <h4>3. Vigencia del Contrato</h4>
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="fechaInicio" class="block mb-2 font-semibold">Fecha Inicio</label>
              <p-datePicker
                id="fechaInicio"
                [(ngModel)]="fechaInicio"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                appendTo="body"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-6">
              <label for="fechaTermino" class="block mb-2 font-semibold">Fecha Término</label>
              <p-datePicker
                id="fechaTermino"
                [(ngModel)]="fechaTermino"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                [minDate]="fechaInicio || undefined"
                appendTo="body"
                class="w-full"
              />
            </div>
          </div>
        </div>
      }

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
    .wizard-paso2 {
      padding: 2rem;
    }

    .cliente-info {
      border: 1px solid var(--surface-border);
    }

    h4 {
      color: var(--primary-color);
      margin-bottom: 1rem;
    }
  `]
})
export class WizardPaso2ContratoNuevoComponent {
    private wizardService = inject(WizardService);
    private clientesService = inject(ClientesService);

    // Búsqueda de cliente
    rutBusqueda = '';
    cliente = signal<IWizardCliente | null>(null);
    buscando = signal(false);
    errorBusqueda = signal<string | null>(null);

    // Datos del contrato
    tipoCodigoProyecto: 'CHI' | 'SAP' | 'SISON' | null = null;
    codigoProyecto = '';
    fechaInicio: Date | null = null;
    fechaTermino: Date | null = null;

    tiposCodigo = [
        { label: 'CHI', value: 'CHI' },
        { label: 'SAP', value: 'SAP' },
        { label: 'SISON', value: 'SISON' }
    ];

    async buscarCliente(): Promise<void> {
        if (!this.rutBusqueda) return;

        this.buscando.set(true);
        this.errorBusqueda.set(null);

        try {
            const response = await this.clientesService.obtenerClientePorRut(this.rutBusqueda);
            this.cliente.set({
                rutCliente: response.rutCliente,
                nombreCliente: response.nombreCliente,
                razonSocial: response.razonSocial
            });
        } catch (error: any) {
            console.error('Error buscando cliente:', error);
            this.errorBusqueda.set(error?.error?.message || 'Cliente no encontrado');
            this.cliente.set(null);
        } finally {
            this.buscando.set(false);
        }
    }

    getPlaceholderCodigo(): string {
        switch (this.tipoCodigoProyecto) {
            case 'CHI': return 'CC-CHI-0000012345';
            case 'SAP': return 'C-12345600012';
            case 'SISON': return '201817664-1';
            default: return 'Ingrese el código del proyecto';
        }
    }

    formularioValido(): boolean {
        return !!(
            this.cliente() &&
            this.tipoCodigoProyecto &&
            this.codigoProyecto &&
            this.fechaInicio &&
            this.fechaTermino
        );
    }

    onAtras(): void {
        this.wizardService.pasoAnterior();
    }

    onSiguiente(): void {
        if (!this.formularioValido()) return;

        const contratoNuevo: IWizardContratoNuevo = {
            cliente: this.cliente()!,
            codigoProyecto: this.codigoProyecto,
            tipoCodigoProyecto: this.tipoCodigoProyecto!,
            fechaInicio: this.fechaInicio!,
            fechaTermino: this.fechaTermino!
        };

        this.wizardService.setContratoNuevo(contratoNuevo);
    }
}
