import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { WizardService } from '../../services/wizard.service';
import { WizardPaso1TipoComponent } from '../../components/wizard/wizard-paso1-tipo.component';
import { WizardPaso2ContratoNuevoComponent } from '../../components/wizard/wizard-paso2-contrato-nuevo.component';
import { WizardPaso2ContratoExistenteComponent } from '../../components/wizard/wizard-paso2-contrato-existente.component';
import { WizardPaso3CotizacionComponent } from '../../components/wizard/wizard-paso3-cotizacion.component';
import { WizardPaso4ItemsComponent } from '../../components/wizard/wizard-paso4-items.component';
import { WizardPaso5ResumenComponent } from '../../components/wizard/wizard-paso5-resumen.component';

@Component({
    selector: 'app-wizard-contrato',
    imports: [
        CommonModule,
        ButtonModule,
        WizardPaso1TipoComponent,
        WizardPaso2ContratoNuevoComponent,
        WizardPaso2ContratoExistenteComponent,
        WizardPaso3CotizacionComponent,
        WizardPaso4ItemsComponent,
        WizardPaso5ResumenComponent
    ],
    template: `
    <div class="wizard-container">
      <div class="wizard-header mb-4">
        <h2 class="m-0">
          <i class="pi pi-sparkles mr-2"></i>
          Asistente de Creación: Contrato y Cotización
        </h2>
        <p class="text-color-secondary mt-2">
          Cree un nuevo contrato con su cotización o agregue una cotización a un contrato existente
        </p>
      </div>

      <!-- Header de pasos -->
      <div class="wizard-steps-header mb-4">
        <div class="steps-container">
          @for (step of steps(); track step.number) {
            <div class="step-item" [class.active]="pasoActual() === step.number" [class.completed]="pasoActual() > step.number">
              <div class="step-indicator">
                <span class="step-number">{{ step.number }}</span>
                @if (pasoActual() > step.number) {
                  <i class="pi pi-check"></i>
                }
              </div>
              <div class="step-label">
                <span class="step-title">{{ step.title }}</span>
                <span class="step-subtitle">{{ step.subtitle }}</span>
              </div>
              @if (step.number < 5) {
                <div class="step-connector"></div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Contenido del paso actual -->
      <div class="wizard-content">
        @switch (pasoActual()) {
          @case (1) {
            <app-wizard-paso1-tipo />
          }
          @case (2) {
            @if (wizardService.esNuevoContrato()) {
              <app-wizard-paso2-contrato-nuevo />
            } @else {
              <app-wizard-paso2-contrato-existente />
            }
          }
          @case (3) {
            <app-wizard-paso3-cotizacion />
          }
          @case (4) {
            <app-wizard-paso4-items />
          }
          @case (5) {
            <app-wizard-paso5-resumen />
          }
        }
      </div>
    </div>
  `,
    styles: [`
    .wizard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 200px);
    }

    .wizard-header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 2px solid var(--surface-border);

      h2 {
        color: var(--primary-color);
        font-size: 2rem;
        font-weight: 600;
      }

      p {
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .wizard-steps-header {
      padding: 2rem 0;
    }

    .steps-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
    }

    .step-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      opacity: 0.5;
      transition: opacity 0.3s;

      &.active,
      &.completed {
        opacity: 1;
      }

      .step-indicator {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background-color: var(--surface-200);
        color: var(--text-color-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1.25rem;
        margin-bottom: 0.75rem;
        position: relative;
        z-index: 2;
        transition: all 0.3s;
      }

      &.active .step-indicator {
        background-color: var(--primary-color);
        color: white;
        box-shadow: 0 0 0 4px var(--primary-50);
      }

      &.completed .step-indicator {
        background-color: var(--green-500);
        color: white;

        .step-number {
          display: none;
        }
      }

      .step-label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .step-title {
        font-weight: 600;
        color: var(--text-color);
        font-size: 0.95rem;
      }

      .step-subtitle {
        font-size: 0.8rem;
        color: var(--text-color-secondary);
      }

      &.active .step-title {
        color: var(--primary-color);
      }

      .step-connector {
        position: absolute;
        top: 1.5rem;
        left: 50%;
        width: 100%;
        height: 2px;
        background-color: var(--surface-300);
        z-index: 1;
        transition: background-color 0.3s;
      }

      &.completed .step-connector {
        background-color: var(--green-500);
      }
    }

    .wizard-content {
      background: white;
      border-radius: 12px;
      border: 1px solid var(--surface-border);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      min-height: 400px;
    }

    @media (max-width: 768px) {
      .wizard-container {
        padding: 1rem;
      }

      .wizard-header h2 {
        font-size: 1.5rem;
      }

      .steps-container {
        flex-direction: column;
        gap: 1rem;
      }

      .step-item {
        flex-direction: row;
        text-align: left;
        width: 100%;

        .step-connector {
          display: none;
        }
      }
    }
  `]
})
export class WizardContratoComponent {
    wizardService = inject(WizardService);

    pasoActual = this.wizardService.pasoActual;

    steps = computed(() => {
        const esNuevo = this.wizardService.esNuevoContrato();
        return [
            { number: 1, title: 'Tipo de Operación', subtitle: '¿Qué deseas hacer?' },
            { number: 2, title: esNuevo ? 'Datos del Contrato' : 'Seleccionar Contrato', subtitle: esNuevo ? 'Información del nuevo contrato' : 'Buscar contrato existente' },
            { number: 3, title: 'Datos de Cotización', subtitle: 'Información de la cotización' },
            { number: 4, title: 'Items de Servicio', subtitle: 'Agregar servicios' },
            { number: 5, title: 'Resumen y Confirmación', subtitle: 'Revisar y confirmar' }
        ];
    });
}
