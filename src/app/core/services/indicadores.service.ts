import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface IIndicadorValor {
    Valor: string;
    Fecha: string;
}

export interface IDolarResponse {
    Dolares: IIndicadorValor[];
}

export interface IUFResponse {
    UFs: IIndicadorValor[];
}

@Injectable({
    providedIn: 'root',
})
export class IndicadoresService {
    private http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    valorDolar = signal<number>(0);
    valorUF = signal<number>(0);
    fechaDolar = signal<string>('');
    fechaUF = signal<string>('');
    loading = signal(false);

    async cargarIndicadores(): Promise<void> {
        this.loading.set(true);
        try {
            const [dolar, uf] = await Promise.all([
                this.http.get<IDolarResponse>(`${this.API_URL}/indicadores/dolar`).toPromise(),
                this.http.get<IUFResponse>(`${this.API_URL}/indicadores/uf`).toPromise()
            ]);

            if (dolar?.Dolares?.[0]) {
                // Limpiar formato: "889,54" -> 889.54
                const valorDolarStr = dolar.Dolares[0].Valor.replace('.', '').replace(',', '.');
                this.valorDolar.set(parseFloat(valorDolarStr));
                this.fechaDolar.set(dolar.Dolares[0].Fecha);
            }

            if (uf?.UFs?.[0]) {
                // Limpiar formato: "39.731,72" -> 39731.72
                const valorUFStr = uf.UFs[0].Valor.replace(/\./g, '').replace(',', '.');
                this.valorUF.set(parseFloat(valorUFStr));
                this.fechaUF.set(uf.UFs[0].Fecha);
            }
        } catch (error) {
            console.error('Error cargando indicadores:', error);
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Convierte un monto a pesos chilenos según la moneda
     * @param monto El monto original
     * @param idTipoMoneda ID de la moneda (1=Pesos, 2=Dólares, 3=UF)
     * @returns El monto convertido a pesos
     */
    convertirAPesos(monto: number, idTipoMoneda: number): number {
        switch (idTipoMoneda) {
            case 1: // Pesos
                return monto;
            case 2: // Dólares
                return monto * this.valorDolar();
            case 3: // UF
                return monto * this.valorUF();
            default:
                return monto;
        }
    }
}
