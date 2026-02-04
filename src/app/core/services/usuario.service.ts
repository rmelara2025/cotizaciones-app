import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IUsuario {
  idUsuario: string;
  nombreUsuario: string;
  emailUsuario: string;
  claveUsuario?: string;
}

export interface IRol {
  idRol: number;
  nombreRol: string;
  descripcionRol?: string;
}

export interface IUsuarioRol {
  idRol: number;
  nombreRol: string;
  permisos?: string[];
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuario`;

  listarTodos(): Observable<IUsuario[]> {
    return this.http.get<IUsuario[]>(this.apiUrl);
  }

  obtenerPorId(idUsuario: string): Observable<IUsuario> {
    return this.http.get<IUsuario>(`${this.apiUrl}/${idUsuario}`);
  }

  crear(usuario: IUsuario): Observable<IUsuario> {
    return this.http.post<IUsuario>(this.apiUrl, usuario);
  }

  actualizar(idUsuario: string, usuario: IUsuario): Observable<IUsuario> {
    return this.http.put<IUsuario>(`${this.apiUrl}/${idUsuario}`, usuario);
  }

  eliminar(idUsuario: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idUsuario}`);
  }

  listarRolesDisponibles(): Observable<IRol[]> {
    return this.http.get<IRol[]>(`${this.apiUrl}/roles/disponibles`);
  }

  obtenerRolesUsuario(idUsuario: string): Observable<IUsuarioRol[]> {
    return this.http.get<IUsuarioRol[]>(`${this.apiUrl}/${idUsuario}/roles`);
  }

  asignarRoles(idUsuario: string, rolesIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idUsuario}/roles`, rolesIds);
  }
}
