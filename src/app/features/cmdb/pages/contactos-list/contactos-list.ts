import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ContactosService } from '../../../../core/services/contactos.service';
import { IContacto, IContactoCreate, IContactoUpdate, CARGO_OPTIONS } from '../../../../core/models';
import { cleanRut } from '../../../../core/utils/rut.utils';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-contactos-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        TooltipModule,
        ConfirmDialogModule,
        ToastModule,
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './contactos-list.html',
    styleUrl: './contactos-list.scss',
})
export class ContactosList implements OnInit {
    private contactosService = inject(ContactosService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);

    // Permisos
    canEditContactos = computed(() => this.authService.can('GESTIONAR_CLIENTES'));

    // Estado del diálogo
    displayDialog = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
    dialogTitle = signal<string>('');

    // Formulario del contacto
    contactoForm = signal<IContactoCreate | IContactoUpdate>({
        rutCliente: '',
        nombre: '',
        email: '',
        telefono: '',
        cargo: '',
    });

    // ID del contacto en edición
    editingContactoId = signal<number | null>(null);

    // RUT del cliente actual
    rutCliente = signal<string>('');
    nombreCliente = signal<string>('');

    // Opciones del dropdown de cargo
    cargoOptions = CARGO_OPTIONS;

    get contactos() {
        return this.contactosService.contactos();
    }

    get loading() {
        return this.contactosService.loading();
    }

    get error() {
        return this.contactosService.error();
    }

    ngOnInit() {
        // Obtener el RUT del cliente desde los parámetros de la ruta
        this.route.queryParams.subscribe(params => {
            const rut = params['rut'];
            const nombre = params['nombre'];
            if (rut) {
                // Limpiar el RUT antes de usarlo (remover puntos, espacios, mantener guion)
                const rutLimpio = cleanRut(rut);
                this.rutCliente.set(rutLimpio);
                this.nombreCliente.set(nombre || '');
                this.contactosService.loadContactosByRut(rutLimpio);
            } else {
                // Si no hay RUT, redirigir a la lista de clientes
                this.router.navigate(['/cmdb/clientes']);
            }
        });
    }

    /**
     * Abrir diálogo para crear nuevo contacto
     */
    openNewContactoDialog() {
        this.isEditMode.set(false);
        this.dialogTitle.set('Agregar Contacto');
        this.contactoForm.set({
            rutCliente: cleanRut(this.rutCliente()),
            nombre: '',
            email: '',
            telefono: '',
            cargo: '',
        });
        this.displayDialog.set(true);
    }

    /**
     * Abrir diálogo para editar contacto existente
     */
    openEditContactoDialog(contacto: IContacto) {
        this.isEditMode.set(true);
        this.dialogTitle.set('Editar Contacto');
        this.editingContactoId.set(contacto.idcontacto!);
        this.contactoForm.set({
            rutCliente: contacto.rutCliente,
            nombre: contacto.nombre,
            email: contacto.email,
            telefono: contacto.telefono,
            cargo: contacto.cargo,
        });
        this.displayDialog.set(true);
    }

    /**
     * Guardar contacto (crear o actualizar)
     */
    async saveContacto() {
        const form = this.contactoForm();

        // Validaciones básicas
        if (!form.nombre || !form.email || !form.telefono || !form.cargo) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Todos los campos son obligatorios',
            });
            return;
        }

        try {
            if (this.isEditMode()) {
                // Actualizar contacto existente
                const id = this.editingContactoId();
                if (id) {
                    await this.contactosService.updateContacto(id, form as IContactoUpdate);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Contacto actualizado correctamente',
                    });
                }
            } else {
                // Crear nuevo contacto
                await this.contactosService.createContacto(form as IContactoCreate);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Contacto creado correctamente',
                });
            }
            this.displayDialog.set(false);
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: this.isEditMode() ? 'Error al actualizar el contacto' : 'Error al crear el contacto',
            });
        }
    }

    /**
     * Confirmar y eliminar contacto
     */
    confirmDelete(contacto: IContacto) {
        console.log('Contacto a eliminar:', contacto);

        if (!contacto.idcontacto) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se puede eliminar: ID de contacto no válido',
            });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el contacto ${contacto.nombre}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await this.contactosService.deleteContacto(contacto.idcontacto!);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Contacto eliminado correctamente',
                    });
                } catch (error) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al eliminar el contacto',
                    });
                }
            },
        });
    }

    /**
     * Volver a la lista de clientes
     */
    volver() {
        this.router.navigate(['/clientes']);
    }
}
