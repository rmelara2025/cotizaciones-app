// src/app/features/dashboard/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IDashboardContrato } from '../models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API = 'http://localhost:8080/api/dashboard';

    getContratosDashboard(): Observable<IDashboardContrato[]> {
        return this.http.get<IDashboardContrato[]>(`${this.API}/recurrentes`);
    }
}
