import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { WizardService } from '../../services/wizard.service';
import { ContratosService } from '../../../../core/services/contratos.service';
import { IContrato } from '../../../../core/models';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';

@Component({
    selector: 'app-wizard-paso2-contrato-existente',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        TableModule,
        TagModule,
        InputGroupModule,
        SelectModule,
        RadioButtonModule,
        FormatRutPipe,
        RutInputDirective
    ],
    template: `
    <div class="wizard-paso wizard-paso2-existente">
      <h3 class="mb-4">Seleccionar Contrato Existente</h3>

      <!-- Filtros -->
      <div class="grid mb-3">
        <div class="col-12 md:col-4">
          <label for="rutCliente" class="block mb-2 font-semibold">RUT Cliente</label>
          <input
            pInputText
            id="rutCliente"
            [(ngModel)]="filtros.rutCliente"
            placeholder="12345678-9"
            appRutInput
            (keyup.enter)="buscar()"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-4">
          <label for="nombreCliente" class="block mb-2 font-semibold">Nombre Cliente</label>
          <input
            pInputText
            id="nombreCliente"
            [(ngModel)]="filtros.nombreCliente"
            placeholder="Buscar por nombre"
            (keyup.enter)="buscar()"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-4 flex align-items-end">
          <p-button
            label="Buscar"
            icon="pi pi-search"
            (onClick)="buscar()"
            class="w-full"
            [loading]="cargando()"
          />
        </div>
      </div>

      <!-- Tabla de Contratos -->
      <p-table
        [value]="contratos()"
        [loading]="cargando()"
        selectionMode="single"
        [(selection)]="contratoSeleccionado"
        dataKey="idContrato"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem"></th>
            <th>RUT Cliente</th>
            <th>Nombre Cliente</th>
            <th>Código Proyecto</th>
            <th>Fecha Inicio</th>
            <th>Fecha Término</th>
            <th>Estado</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-contrato>
          <tr [pSelectableRow]="contrato">
            <td>
              <p-radioButton
                [name]="'contrato'"
                [value]="contrato"
                [(ngModel)]="contratoSeleccionado"
              />
            </td>
            <td>{{ contrato.rutCliente | formatRut }}</td>
            <td>{{ contrato.nombreCliente }}</td>
            <td>{{ contrato.codSap || contrato.codChi || contrato.codSison }}</td>
            <td>{{ contrato.fechaInicio | date: 'dd/MM/yyyy' }}</td>
            <td>{{ contrato.fechaTermino | date: 'dd/MM/yyyy' }}</td>
            <td>
              <p-tag [value]="getEstadoContrato(contrato)" [severity]="getEstadoSeverity(contrato)" />
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center p-4">
              @if (cargando()) {
                Cargando contratos...
              } @else {
                No se encontraron contratos. Intente con otros filtros.
              }
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Contrato Seleccionado (readonly) -->
      @if (contratoSeleccionado) {
        <div class="contrato-seleccionado mt-4 p-3 surface-card border-round">
          <h4 class="mb-3">Contrato Seleccionado</h4>
          <div class="grid">
            <div class="col-12 md:col-3">
              <label class="block text-sm font-semibold mb-1">RUT Cliente</label>
              <p class="m-0">{{ contratoSeleccionado.rutCliente | formatRut }}</p>
            </div>
            <div class="col-12 md:col-3">
              <label class="block text-sm font-semibold mb-1">Nombre</label>
              <p class="m-0">{{ contratoSeleccionado.nombreCliente }}</p>
            </div>
            <div class="col-12 md:col-3">
              <label class="block text-sm font-semibold mb-1">Código Proyecto</label>
              <p class="m-0">{{ contratoSeleccionado.codSap || contratoSeleccionado.codChi || contratoSeleccionado.codSison }}</p>
            </div>
            <div class="col-12 md:col-3">
              <label class="block text-sm font-semibold mb-1">Vigencia</label>
              <p class="m-0">
                {{ contratoSeleccionado.fechaInicio | date: 'dd/MM/yyyy' }} -
                {{ contratoSeleccionado.fechaTermino | date: 'dd/MM/yyyy' }}
              </p>
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
          [disabled]="!contratoSeleccionado"
        />
      </div>
    </div>
  `,
    styles: [`
    .wizard-paso2-existente {
      padding: 2rem;
    }

    .contrato-seleccionado {
      border: 2px solid var(--primary-color);
      background-color: var(--primary-50);
    }

    h4 {
      color: var(--primary-color);
    }

    :host ::ng-deep {
      .p-datatable .p-datatable-tbody > tr.p-highlight {
        background-color: var(--primary-100);
      }
    }
  `]
})
export class WizardPaso2ContratoExistenteComponent implements OnInit {
    private wizardService = inject(WizardService);
    private contratosService = inject(ContratosService);

    contratos = this.contratosService.contratos;
    cargando = this.contratosService.loading;

    filtros = {
        rutCliente: '',
        nombreCliente: '',
        estado: 'vigente'
    };

    contratoSeleccionado: IContrato | null = null;

    ngOnInit(): void {
        // Cargar contratos vigentes por defecto
        this.buscar();
    }

    buscar(): void {
        this.contratosService.loadContratos(
            0,
            50,
            'fechaInicio',
            'desc',
            {
                rutCliente: this.filtros.rutCliente || undefined,
                nombreCliente: this.filtros.nombreCliente || undefined,
                estado: this.filtros.estado as any
            }
        );
    }

    getEstadoContrato(contrato: IContrato): string {
        const hoy = new Date();
        const termino = new Date(contrato.fechaTermino);

        if (termino < hoy) return 'Expirado';

        const diasRestantes = Math.ceil((termino.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 30) return 'Por Expirar';

        return 'Vigente';
    }

    getEstadoSeverity(contrato: IContrato): 'success' | 'warn' | 'danger' {
        const estado = this.getEstadoContrato(contrato);
        switch (estado) {
            case 'Vigente': return 'success';
            case 'Por Expirar': return 'warn';
            case 'Expirado': return 'danger';
            default: return 'success';
        }
    }

    onAtras(): void {
        this.wizardService.pasoAnterior();
    }

    onSiguiente(): void {
        if (this.contratoSeleccionado) {
            this.wizardService.setContratoExistente(this.contratoSeleccionado);
        }
    }
}
