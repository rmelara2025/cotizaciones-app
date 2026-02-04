import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuarioService, IUsuario, IRol, IUsuarioRol } from '../../../../core/services/usuario.service';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    MultiSelectModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosList implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  usuarios = signal<IUsuario[]>([]);
  rolesDisponibles = signal<IRol[]>([]);
  rolesUsuario = signal<IUsuarioRol[]>([]);
  loading = signal(false);
  displayDialog = signal(false);
  displayRolesDialog = signal(false);
  isEditMode = signal(false);
  usuarioSeleccionado: string = '';
  rolesSeleccionados: number[] = [];

  usuarioForm: IUsuario = {
    idUsuario: '',
    nombreUsuario: '',
    emailUsuario: '',
    claveUsuario: '',
  };

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRolesDisponibles();
  }

  cargarRolesDisponibles(): void {
    this.usuarioService.listarRolesDisponibles().subscribe({
      next: (roles) => {
        this.rolesDisponibles.set(roles);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
      },
    });
  }

  cargarUsuarios(): void {
    this.loading.set(true);
    this.usuarioService.listarTodos().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios',
        });
        this.loading.set(false);
      },
    });
  }

  abrirDialogNuevo(): void {
    this.usuarioForm = {
      idUsuario: '',
      nombreUsuario: '',
      emailUsuario: '',
      claveUsuario: '',
    };
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  abrirDialogEditar(usuario: IUsuario): void {
    this.usuarioForm = {
      idUsuario: usuario.idUsuario,
      nombreUsuario: usuario.nombreUsuario,
      emailUsuario: usuario.emailUsuario,
      claveUsuario: '',
    };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  guardar(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading.set(true);

    if (this.isEditMode()) {
      this.usuarioService.actualizar(this.usuarioForm.idUsuario, this.usuarioForm).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario actualizado correctamente',
          });
          this.cargarUsuarios();
          this.cerrarDialog();
        },
        error: (err) => {
          console.error('Error al actualizar usuario:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar el usuario',
          });
          this.loading.set(false);
        },
      });
    } else {
      this.usuarioService.crear(this.usuarioForm).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario creado correctamente',
          });
          this.cargarUsuarios();
          this.cerrarDialog();
        },
        error: (err) => {
          console.error('Error al crear usuario:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear el usuario',
          });
          this.loading.set(false);
        },
      });
    }
  }

  confirmarEliminar(usuario: IUsuario): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar al usuario ${usuario.nombreUsuario}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminar(usuario.idUsuario);
      },
    });
  }

  private eliminar(idUsuario: string): void {
    this.loading.set(true);
    this.usuarioService.eliminar(idUsuario).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario eliminado correctamente',
        });
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el usuario',
        });
        this.loading.set(false);
      },
    });
  }

  cerrarDialog(): void {
    this.displayDialog.set(false);
    this.usuarioForm = {
      idUsuario: '',
      nombreUsuario: '',
      emailUsuario: '',
      claveUsuario: '',
    };
  }

  private validarFormulario(): boolean {
    if (!this.usuarioForm.idUsuario.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El ID de usuario es requerido',
      });
      return false;
    }

    if (!this.usuarioForm.nombreUsuario.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El nombre de usuario es requerido',
      });
      return false;
    }

    if (!this.isEditMode() && !this.usuarioForm.claveUsuario?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La contraseña es requerida para nuevos usuarios',
      });
      return false;
    }

    return true;
  }

  abrirDialogRoles(usuario: IUsuario): void {
    this.usuarioSeleccionado = usuario.idUsuario;
    this.loading.set(true);
    
    this.usuarioService.obtenerRolesUsuario(usuario.idUsuario).subscribe({
      next: (roles) => {
        this.rolesUsuario.set(roles);
        // Extraer IDs de los roles actuales (manejar tanto idRol como idrol)
        this.rolesSeleccionados = roles.map(r => r.idRol || (r as any).idrol).filter(id => id !== undefined);
        this.displayRolesDialog.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener roles del usuario:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los roles del usuario',
        });
        this.loading.set(false);
      },
    });
  }

  guardarRoles(): void {
    this.loading.set(true);
    
    this.usuarioService.asignarRoles(this.usuarioSeleccionado, this.rolesSeleccionados).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Roles asignados correctamente',
        });
        this.cerrarDialogRoles();
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al asignar roles:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron asignar los roles',
        });
        this.loading.set(false);
      },
    });
  }

  cerrarDialogRoles(): void {
    this.displayRolesDialog.set(false);
    this.usuarioSeleccionado = '';
    this.rolesSeleccionados = [];
    this.rolesUsuario.set([]);
    this.loading.set(false);
  }

  getRolNombre(idRol: number): string {
    const rol = this.rolesDisponibles().find(r => r.idRol === idRol);
    return rol ? rol.nombreRol : '';
  }
}
