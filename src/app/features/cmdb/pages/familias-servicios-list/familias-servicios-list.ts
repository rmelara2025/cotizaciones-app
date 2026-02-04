import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CatalogosService, IFamilia, IServicioDetalle } from '../../../../core/services/catalogos.service';

@Component({
  selector: 'app-familias-servicios-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './familias-servicios-list.html',
  styleUrls: ['./familias-servicios-list.scss']
})
export class FamiliasServiciosList implements OnInit {
  private catalogosService = inject(CatalogosService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // Signals
  familias = signal<IFamilia[]>([]);
  servicios = signal<IServicioDetalle[]>([]);
  loading = signal(false);
  displayFamiliaDialog = signal(false);
  displayServicioDialog = signal(false);
  isEditMode = signal(false);
  activeTab = signal<'familias' | 'servicios'>('familias');

  // Forms
  familiaForm: IFamilia = {
    nombreFamilia: '',
    descripcion: ''
  };

  servicioForm: IServicioDetalle = {
    idFamilia: 0,
    nombre: '',
    descripcion: '',
    atributosSchema: '',
    idProveedor: undefined
  };

  ngOnInit(): void {
    this.cargarFamilias();
    this.cargarServicios();
  }

  // Familias
  cargarFamilias(): void {
    this.loading.set(true);
    this.catalogosService.listarFamilias().subscribe({
      next: (data) => {
        this.familias.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar familias:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las familias'
        });
        this.loading.set(false);
      }
    });
  }

  abrirDialogFamiliaNueva(): void {
    this.isEditMode.set(false);
    this.familiaForm = {
      nombreFamilia: '',
      descripcion: ''
    };
    this.displayFamiliaDialog.set(true);
  }

  abrirDialogFamiliaEditar(familia: IFamilia): void {
    this.isEditMode.set(true);
    this.familiaForm = { ...familia };
    this.displayFamiliaDialog.set(true);
  }

  guardarFamilia(): void {
    if (!this.validarFamilia()) return;

    this.loading.set(true);
    const operacion = this.isEditMode()
      ? this.catalogosService.actualizarFamilia(this.familiaForm.idFamilia!, this.familiaForm)
      : this.catalogosService.crearFamilia(this.familiaForm);

    operacion.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Familia ${this.isEditMode() ? 'actualizada' : 'creada'} correctamente`
        });
        this.displayFamiliaDialog.set(false);
        this.cargarFamilias();
        this.cargarServicios(); // Recargar servicios para actualizar nombreFamilia
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al guardar familia:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la familia'
        });
        this.loading.set(false);
      }
    });
  }

  confirmarEliminarFamilia(familia: IFamilia): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la familia "${familia.nombreFamilia}"? Esto también eliminará todos los servicios asociados.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarFamilia(familia.idFamilia!);
      }
    });
  }

  eliminarFamilia(idFamilia: number): void {
    this.loading.set(true);
    this.catalogosService.eliminarFamilia(idFamilia).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Familia eliminada correctamente'
        });
        this.cargarFamilias();
        this.cargarServicios();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al eliminar familia:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la familia'
        });
        this.loading.set(false);
      }
    });
  }

  validarFamilia(): boolean {
    if (!this.familiaForm.nombreFamilia?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El nombre de la familia es requerido'
      });
      return false;
    }
    return true;
  }

  // Servicios
  cargarServicios(): void {
    this.loading.set(true);
    this.catalogosService.listarServicios().subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar servicios:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los servicios'
        });
        this.loading.set(false);
      }
    });
  }

  abrirDialogServicioNuevo(): void {
    this.isEditMode.set(false);
    this.servicioForm = {
      idFamilia: 0,
      nombre: '',
      descripcion: '',
      atributosSchema: '',
      idProveedor: undefined
    };
    this.displayServicioDialog.set(true);
  }

  abrirDialogServicioEditar(servicio: any): void {
    this.isEditMode.set(true);
    this.servicioForm = { ...servicio };
    this.displayServicioDialog.set(true);
  }

  guardarServicio(): void {
    if (!this.validarServicio()) return;

    this.loading.set(true);
    const operacion = this.isEditMode()
      ? this.catalogosService.actualizarServicio(this.servicioForm.idServicio!, this.servicioForm)
      : this.catalogosService.crearServicio(this.servicioForm);

    operacion.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Servicio ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`
        });
        this.displayServicioDialog.set(false);
        this.cargarServicios();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al guardar servicio:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el servicio'
        });
        this.loading.set(false);
      }
    });
  }

  confirmarEliminarServicio(servicio: any): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el servicio "${servicio.nombreServicio}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarServicio(servicio.idServicio!);
      }
    });
  }

  eliminarServicio(idServicio: number): void {
    this.loading.set(true);
    this.catalogosService.eliminarServicio(idServicio).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Servicio eliminado correctamente'
        });
        this.cargarServicios();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al eliminar servicio:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el servicio'
        });
        this.loading.set(false);
      }
    });
  }

  validarServicio(): boolean {
    if (!this.servicioForm.idFamilia || this.servicioForm.idFamilia === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe seleccionar una familia'
      });
      return false;
    }
    if (!this.servicioForm.nombre?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El nombre del servicio es requerido'
      });
      return false;
    }
    return true;
  }

  cerrarDialog(): void {
    this.displayFamiliaDialog.set(false);
    this.displayServicioDialog.set(false);
  }

  getNombreFamilia(idFamilia: number): string {
    const familia = this.familias().find(f => f.idFamilia === idFamilia);
    return familia ? familia.nombreFamilia : '';
  }
}
