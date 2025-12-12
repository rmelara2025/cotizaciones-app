import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IFamilia {
    idFamilia: number;
    nombreFamilia: string;
}

export interface IServicioFamilia {
    idServicio: number;
    nombreServicio: string;
    idFamilia: number;
    descripcion: string | null;
    atributos: any;
    idProveedor: number | null;
}

export interface IFamiliaConServicios {
    idFamilia: number;
    nombreFamilia: string;
    descripcion: string;
    servicios: IServicioFamilia[];
}

@Injectable({
    providedIn: 'root',
})
export class FamiliaService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/api';

    getFamilias(): Observable<IFamilia[]> {
        return this.http.get<IFamilia[]>(`${this.API_URL}/familias`);
    }

    getServiciosPorFamilia(idFamilia: number): Observable<IServicioFamilia[]> {
        return this.http.get<IFamiliaConServicios>(`${this.API_URL}/familias/${idFamilia}/servicios`)
            .pipe(
                map(response => response.servicios || [])
            );
    }

}
