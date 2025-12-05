// src/app/features/dashboard/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardContrato } from './../../features/cmdb/models/dashboard/dashboard.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API = 'http://localhost:8080/api/dashboard';

    getContratosDashboard(): Observable<DashboardContrato[]> {
        return this.http.get<DashboardContrato[]>(`${this.API}/recurrentes`);
    }
}
