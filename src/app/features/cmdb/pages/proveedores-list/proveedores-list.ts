import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CatalogosService, IProveedor, IProveedorDetalle, IServicio } from '../../../../core/services/catalogos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';

@Component({
    selector: 'app-proveedores-list',
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        MultiSelectModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule,
        TagModule,
        FormatRutPipe,
        RutInputDirective
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './proveedores-list.html',
    styleUrl: './proveedores-list.scss'
})
export class ProveedoresList implements OnInit {
    private catalogosService = inject(CatalogosService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);

    // Permisos
    canManage = computed(() => this.authService.can('GESTIONAR_PROVEEDORES'));
    canView = computed(() => this.authService.can('VER_PROVEEDORES'));

    // Signals
    proveedores = signal<IProveedor[]>([]);
    loading = signal(false);
    displayProveedorDialog = signal(false);
    displayServiciosDialog = signal(false);
    isEditMode = signal(false);
    proveedorSeleccionado = signal<IProveedorDetalle | null>(null);

    // Computed para servicios desde el servicio
    servicios = computed(() => this.catalogosService.servicios());

    // Forms
    proveedorForm: IProveedor = {
        nombreProveedor: '',
        razonSocialProveedor: '',
        contactoProveedor: '',
        telefonoProveedor: '',
        emailProveedor: '',
        estado: 1,
        rutProveedor: '',
        serviciosIds: []
    };

    ngOnInit(): void {
        this.cargarProveedores();
        this.cargarServicios();
    }

    cargarProveedores(): void {
        this.loading.set(true);
        this.catalogosService.listarProveedores().subscribe({
            next: (data) => {
                this.proveedores.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar proveedores:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los proveedores'
                });
                this.loading.set(false);
            }
        });
    }

    cargarServicios(): void {
        this.catalogosService.loadServicios();
    }

    abrirDialogProveedorNuevo(): void {
        this.isEditMode.set(false);
        this.proveedorForm = {
            nombreProveedor: '',
            razonSocialProveedor: '',
            contactoProveedor: '',
            telefonoProveedor: '',
            emailProveedor: '',
            estado: 1,
            rutProveedor: '',
            serviciosIds: []
        };
        this.displayProveedorDialog.set(true);
    }

    abrirDialogProveedorEditar(proveedor: IProveedor): void {
        this.isEditMode.set(true);

        // Cargar detalle con servicios
        if (proveedor.idProveedor) {
            this.catalogosService.obtenerProveedorDetalle(proveedor.idProveedor).subscribe({
                next: (detalle) => {
                    this.proveedorForm = {
                        idProveedor: detalle.idProveedor,
                        nombreProveedor: detalle.nombreProveedor,
                        razonSocialProveedor: detalle.razonSocialProveedor || '',
                        contactoProveedor: detalle.contactoProveedor || '',
                        telefonoProveedor: detalle.telefonoProveedor || '',
                        emailProveedor: detalle.emailProveedor || '',
                        estado: detalle.estado || 1,
                        rutProveedor: detalle.rutProveedor || '',
                        serviciosIds: detalle.servicios?.map(s => s.idServicio) || []
                    };
                    this.displayProveedorDialog.set(true);
                },
                error: (err) => {
                    console.error('Error al cargar detalle:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cargar el detalle del proveedor'
                    });
                }
            });
        }
    }

    guardarProveedor(): void {
        if (!this.proveedorForm.nombreProveedor?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'El nombre del proveedor es obligatorio'
            });
            return;
        }

        this.loading.set(true);

        if (this.isEditMode() && this.proveedorForm.idProveedor) {
            this.catalogosService.actualizarProveedor(this.proveedorForm.idProveedor, this.proveedorForm)
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Proveedor actualizado correctamente'
                        });
                        this.displayProveedorDialog.set(false);
                        this.cargarProveedores();
                    },
                    error: (err) => {
                        console.error('Error al actualizar:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.error?.message || 'No se pudo actualizar el proveedor'
                        });
                        this.loading.set(false);
                    }
                });
        } else {
            this.catalogosService.crearProveedor(this.proveedorForm).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Proveedor creado correctamente'
                    });
                    this.displayProveedorDialog.set(false);
                    this.cargarProveedores();
                },
                error: (err) => {
                    console.error('Error al crear:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.message || 'No se pudo crear el proveedor'
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    confirmarEliminar(proveedor: IProveedor): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar el proveedor "${proveedor.nombreProveedor}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (proveedor.idProveedor) {
                    this.loading.set(true);
                    this.catalogosService.eliminarProveedor(proveedor.idProveedor).subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Proveedor eliminado correctamente'
                            });
                            this.cargarProveedores();
                        },
                        error: (err) => {
                            console.error('Error al eliminar:', err);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar el proveedor'
                            });
                            this.loading.set(false);
                        }
                    });
                }
            }
        });
    }

    verServicios(proveedor: IProveedor): void {
        if (proveedor.idProveedor) {
            this.catalogosService.obtenerProveedorDetalle(proveedor.idProveedor).subscribe({
                next: (detalle) => {
                    this.proveedorSeleccionado.set(detalle);
                    this.displayServiciosDialog.set(true);
                },
                error: (err) => {
                    console.error('Error al cargar servicios:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar los servicios del proveedor'
                    });
                }
            });
        }
    }

    getEstadoSeverity(estado: number | undefined): 'success' | 'danger' {
        return estado === 1 ? 'success' : 'danger';
    }

    getEstadoLabel(estado: number | undefined): string {
        return estado === 1 ? 'Activo' : 'Inactivo';
    }
}
