import { Component, OnInit, inject, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientesService } from '../../../../core/services/clientes.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatRutPipe } from '../../../../core/pipes/format-rut.pipe';
import { RutInputDirective } from '../../../../core/pipes/rut-only.directive';
import { cleanRut } from '../../../../core/utils/rut.utils';
import { ICliente, IClienteFilters, DEFAULT_CLIENTE_FILTER, IClienteCreate, IClienteUpdate } from '../../../../core/models';
import { Table } from 'primeng/table';

@Component({
    selector: 'app-clientes-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TooltipModule,
        FormatRutPipe,
        InputTextModule,
        FormsModule,
        RutInputDirective,
        InputGroupModule,
        InputGroupAddonModule,
        DialogModule,
        ConfirmDialogModule,
        ToastModule,
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './clientes-list.html',
    styleUrl: './clientes-list.scss',
})
export class ClientesList implements OnInit {
    @ViewChild('dt') table?: Table;

    private clientesService = inject(ClientesService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    // Filtros tipados
    filters: IClienteFilters = { ...DEFAULT_CLIENTE_FILTER };

    // Estado del diálogo
    displayDialog = false;
    isEditMode = false;
    dialogTitle = '';

    // Formulario del cliente - separar para crear y actualizar
    clienteFormCreate: IClienteCreate = {
        rutCliente: '',
        nombreCliente: '',
        nombreComercial: '',
        razonSocial: '',
    };

    clienteFormUpdate: IClienteUpdate = {
        nombreCliente: '',
        nombreComercial: '',
        razonSocial: '',
    };

    // RUT del cliente en edición (solo para modo editar)
    editingRutCliente = '';

    // Permisos
    canCreateClient = computed(() => this.authService.hasPermission('GESTIONAR_CLIENTES'));
    // Todos pueden ver contactos excepto rol "Vista"
    canSeeContactos = computed(() => !this.authService.hasRole('Vista'));

    get clientes() {
        return this.clientesService.clientes();
    }

    get loading() {
        return this.clientesService.loading();
    }

    get error() {
        return this.clientesService.error();
    }

    get totalRecords() {
        return this.clientesService.totalRecords();
    }

    get pageSize() {
        return this.clientesService.pageSize();
    }

    ngOnInit() {
        // Carga inicial sin filtros
        this.clientesService.loadClientes(0, 10);
    }

    /**
     * Handler para paginación lazy de PrimeNG
     */
    onPageChange(event: any) {
        const page = Math.floor(event.first / event.rows);
        const size = event.rows;
        const sortField = event.sortField || 'rutCliente';
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

        // Limpiar RUT antes de enviar
        const filtrosLimpios = { ...this.filters };
        if (filtrosLimpios.rutCliente) {
            filtrosLimpios.rutCliente = cleanRut(filtrosLimpios.rutCliente);
        }

        this.clientesService.loadClientes(page, size, sortField, sortOrder, filtrosLimpios);
    }

    /**
     * Buscar clientes aplicando filtros
     */
    buscarClientes() {
        // Reiniciar a la primera página cuando se busca
        this.table?.reset();
        // Limpiar RUT antes de enviar
        const filtrosLimpios = { ...this.filters };
        if (filtrosLimpios.rutCliente) {
            filtrosLimpios.rutCliente = cleanRut(filtrosLimpios.rutCliente);
        }
        this.clientesService.loadClientes(0, this.pageSize, 'rutCliente', 'desc', filtrosLimpios);
    }

    /**
     * Limpiar filtros y recargar todos los datos
     */
    limpiarFiltros() {
        this.filters = { ...DEFAULT_CLIENTE_FILTER };
        this.table?.reset();
        this.clientesService.loadClientes(0, this.pageSize);
    }

    /**
     * Helper para mostrar el estado del cliente
     */
    getEstadoLabel(estado: number): string {
        return estado === 1 ? 'Activo' : 'Inactivo';
    }

    /**
     * Helper para el color del badge de estado
     */
    getEstadoSeverity(estado: number): 'success' | 'danger' {
        return estado === 1 ? 'success' : 'danger';
    }

    /**
     * Navegar a cotizaciones filtradas por el RUT del cliente
     */
    verContratos(cliente: ICliente) {
        this.router.navigate(['/cotizaciones'], {
            queryParams: { rutCliente: cliente.rutCliente }
        });
    }

    /**
     * Navegar a la lista de contactos del cliente
     */
    verContactos(cliente: ICliente) {
        // Limpiar el RUT (remover puntos, espacios, mantener guion)
        const rutLimpio = cleanRut(cliente.rutCliente);
        this.router.navigate(['/contactos'], {
            queryParams: {
                rut: rutLimpio,
                nombre: cliente.nombreCliente
            }
        });
    }

    /**
     * Abrir diálogo para crear nuevo cliente
     */
    openNewClienteDialog() {
        this.isEditMode = false;
        this.dialogTitle = 'Nuevo Cliente';
        this.clienteFormCreate = {
            rutCliente: '',
            nombreCliente: '',
            nombreComercial: '',
            razonSocial: '',
        };
        this.displayDialog = true;
    }

    /**
     * Abrir diálogo para editar cliente existente
     */
    openEditClienteDialog(cliente: ICliente) {
        this.isEditMode = true;
        this.dialogTitle = 'Editar Cliente';
        this.editingRutCliente = cliente.rutCliente;
        this.clienteFormUpdate = {
            nombreCliente: cliente.nombreCliente,
            nombreComercial: cliente.nombreComercial,
            razonSocial: cliente.razonSocial,
        };
        this.displayDialog = true;
    }

    /**
     * Guardar cliente (crear o actualizar)
     */
    async saveCliente() {
        try {
            if (this.isEditMode) {
                // Actualizar cliente existente
                await this.clientesService.updateCliente(
                    this.editingRutCliente,
                    this.clienteFormUpdate
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Cliente actualizado correctamente',
                });
            } else {
                // Crear nuevo cliente - limpiar el RUT antes de enviar
                const clienteCreate = { ...this.clienteFormCreate };
                clienteCreate.rutCliente = cleanRut(clienteCreate.rutCliente);

                await this.clientesService.createCliente(clienteCreate);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Cliente creado correctamente',
                });
            }

            this.displayDialog = false;
            // Recargar la tabla
            this.table?.reset();
            this.clientesService.loadClientes(0, this.pageSize, 'rutCliente', 'desc', this.filters);
        } catch (error: any) {
            console.error('❌ Error guardando cliente:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error?.message || 'No se pudo guardar el cliente',
            });
        }
    }

    /**
     * Confirmar eliminación de cliente
     */
    confirmDelete(cliente: ICliente) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el cliente ${cliente.nombreCliente}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteCliente(cliente.rutCliente);
            },
        });
    }

    /**
     * Eliminar cliente
     */
    async deleteCliente(rutCliente: string) {
        try {
            await this.clientesService.deleteCliente(rutCliente);
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Cliente eliminado correctamente',
            });
            // Recargar la tabla
            this.table?.reset();
            this.clientesService.loadClientes(0, this.pageSize, 'rutCliente', 'desc', this.filters);
        } catch (error: any) {
            console.error('❌ Error eliminando cliente:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error?.message || 'No se pudo eliminar el cliente',
            });
        }
    }
}