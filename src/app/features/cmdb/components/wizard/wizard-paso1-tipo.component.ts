import { Component, inject, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { WizardService } from '../../services/wizard.service';

@Component({
    selector: 'app-wizard-paso1-tipo',
    imports: [ButtonModule, RadioButtonModule, FormsModule],
    template: `
    <div class="wizard-paso wizard-paso1">
      <h3 class="mb-4">¿Qué deseas hacer?</h3>

      <div class="flex flex-column gap-4">
        <div class="option-card" [class.selected]="tipoSeleccionado === 'nuevo'">
          <p-radioButton
            name="tipo"
            value="nuevo"
            [(ngModel)]="tipoSeleccionado"
            inputId="tipo-nuevo"
          />
          <label for="tipo-nuevo" class="option-label">
            <i class="pi pi-plus-circle text-4xl mb-2"></i>
            <h4>Crear Nuevo Contrato + Cotización</h4>
            <p class="text-sm text-color-secondary">
              Busca un cliente, crea un contrato y genera su primera cotización
            </p>
          </label>
        </div>

        <div class="option-card" [class.selected]="tipoSeleccionado === 'existente'">
          <p-radioButton
            name="tipo"
            value="existente"
            [(ngModel)]="tipoSeleccionado"
            inputId="tipo-existente"
          />
          <label for="tipo-existente" class="option-label">
            <i class="pi pi-file-plus text-4xl mb-2"></i>
            <h4>Agregar Cotización a Contrato Existente</h4>
            <p class="text-sm text-color-secondary">
              Selecciona un contrato vigente y crea una nueva cotización
            </p>
          </label>
        </div>
      </div>

      <div class="flex justify-content-end gap-2 mt-4">
        <p-button
          label="Siguiente"
          icon="pi pi-arrow-right"
          iconPos="right"
          (onClick)="onSiguiente()"
          [disabled]="!tipoSeleccionado"
        />
      </div>
    </div>
  `,
    styles: [`
    .wizard-paso1 {
      padding: 2rem;
    }

    .option-card {
      border: 2px solid var(--surface-border);
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: flex-start;
      gap: 1rem;

      &:hover {
        border-color: var(--primary-color);
        background-color: var(--surface-hover);
      }

      &.selected {
        border-color: var(--primary-color);
        background-color: var(--primary-50);
      }
    }

    .option-label {
      flex: 1;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      h4 {
        margin: 0;
        font-weight: 600;
      }

      p {
        margin: 0;
      }

      i {
        color: var(--primary-color);
      }
    }

    :host ::ng-deep {
      .p-radiobutton {
        margin-top: 0.5rem;
      }
    }
  `]
})
export class WizardPaso1TipoComponent {
    private wizardService = inject(WizardService);

    tipoSeleccionado: 'nuevo' | 'existente' | null = null;

    onSiguiente(): void {
        if (this.tipoSeleccionado) {
            this.wizardService.setTipoOperacion(this.tipoSeleccionado === 'nuevo');
        }
    }
}
