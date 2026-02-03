import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ICadenciaIngresosFilter, ICadenciaIngresosResponse } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  /**
   * Obtiene el reporte de cadencia de ingresos
   */
  obtenerCadenciaIngresos(filter: ICadenciaIngresosFilter): Observable<ICadenciaIngresosResponse> {
    let params = new HttpParams();

    if (filter.rutCliente) {
      params = params.set('rutCliente', filter.rutCliente);
    }
    if (filter.fechaDesde) {
      params = params.set('fechaDesde', filter.fechaDesde);
    }
    if (filter.fechaHasta) {
      params = params.set('fechaHasta', filter.fechaHasta);
    }
    if (filter.idTipoMoneda !== undefined && filter.idTipoMoneda !== null) {
      params = params.set('idTipoMoneda', filter.idTipoMoneda.toString());
    }

    return this.http.get<ICadenciaIngresosResponse>(`${this.apiUrl}/cadencia-ingresos`, { params });
  }

  /**
   * Exporta el reporte de cadencia de ingresos a Excel desde el backend
   * Se usa para reportes grandes donde el frontend podría quedarse sin memoria
   */
  exportarCadenciaExcel(filter: ICadenciaIngresosFilter): Observable<Blob> {
    let params = new HttpParams();

    if (filter.rutCliente) {
      params = params.set('rutCliente', filter.rutCliente);
    }
    if (filter.fechaDesde) {
      params = params.set('fechaDesde', filter.fechaDesde);
    }
    if (filter.fechaHasta) {
      params = params.set('fechaHasta', filter.fechaHasta);
    }
    if (filter.idTipoMoneda !== undefined && filter.idTipoMoneda !== null) {
      params = params.set('idTipoMoneda', filter.idTipoMoneda.toString());
    }

    return this.http.get(`${this.apiUrl}/cadencia-ingresos/exportar-excel`, { 
      params, 
      responseType: 'blob' 
    });
  }
}
