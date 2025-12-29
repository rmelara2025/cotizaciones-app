import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IContacto, IContactoCreate, IContactoUpdate } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ContactosService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/contactos`;

    // Signals para gestión de estado
    contactos = signal<IContacto[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    /**
     * Obtener todos los contactos de un cliente por RUT
     */
    loadContactosByRut(rut: string): void {
        this.loading.set(true);
        this.error.set(null);

        this.http.get<IContacto[]>(`${this.apiUrl}/cliente/${rut}`)
            .subscribe({
                next: (data) => {
                    console.log('Contactos recibidos:', data);
                    this.contactos.set(data);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set('Error al cargar los contactos');
                    this.loading.set(false);
                    console.error('Error loading contactos:', err);
                },
            });
    }

    /**
     * Crear un nuevo contacto
     */
    createContacto(contacto: IContactoCreate): Promise<IContacto> {
        return new Promise((resolve, reject) => {
            this.loading.set(true);
            this.error.set(null);

            this.http.post<IContacto>(this.apiUrl, contacto)
                .subscribe({
                    next: (data) => {
                        // Agregar el nuevo contacto a la lista
                        this.contactos.update(list => [...list, data]);
                        this.loading.set(false);
                        resolve(data);
                    },
                    error: (err) => {
                        this.error.set('Error al crear el contacto');
                        this.loading.set(false);
                        console.error('Error creating contacto:', err);
                        reject(err);
                    },
                });
        });
    }

    /**
     * Actualizar un contacto existente
     */
    updateContacto(id: number, contacto: IContactoUpdate): Promise<IContacto> {
        return new Promise((resolve, reject) => {
            this.loading.set(true);
            this.error.set(null);

            this.http.put<IContacto>(`${this.apiUrl}/${id}`, contacto)
                .subscribe({
                    next: (data) => {
                        // Actualizar el contacto en la lista
                        this.contactos.update(list =>
                            list.map(c => c.idcontacto === id ? data : c)
                        );
                        this.loading.set(false);
                        resolve(data);
                    },
                    error: (err) => {
                        this.error.set('Error al actualizar el contacto');
                        this.loading.set(false);
                        console.error('Error updating contacto:', err);
                        reject(err);
                    },
                });
        });
    }

    /**
     * Eliminar un contacto
     */
    deleteContacto(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.loading.set(true);
            this.error.set(null);

            this.http.delete<void>(`${this.apiUrl}/${id}`)
                .subscribe({
                    next: () => {
                        // Eliminar el contacto de la lista
                        this.contactos.update(list =>
                            list.filter(c => c.idcontacto !== id)
                        );
                        this.loading.set(false);
                        resolve();
                    },
                    error: (err) => {
                        this.error.set('Error al eliminar el contacto');
                        this.loading.set(false);
                        console.error('Error deleting contacto:', err);
                        reject(err);
                    },
                });
        });
    }

    /**
     * Limpiar el estado
     */
    clear(): void {
        this.contactos.set([]);
        this.loading.set(false);
        this.error.set(null);
    }
}
