import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    /**
     * Maps currency code to locale for Intl.NumberFormat
     * USD: de-DE (Thousands: '.', Decimals: ',')
     * UF:  en-US (Thousands: ',', Decimals: '.')
     * CLP: es-CL (Thousands: '.', No decimals)
     */
    private readonly localeMap: Record<string, string> = {
        USD: 'en-US',
        UF: 'en-US',
        CLP: 'es-CL',
    };

    /**
     * Format amount according to currency locale and standards
     */
    format(amount: number | string, nombreTipoMoneda: string): string {
        const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
        const locale = this.localeMap[nombreTipoMoneda] || 'en-US';
        const options = this.getFormatOptions(nombreTipoMoneda);

        const formatted = new Intl.NumberFormat(locale, options).format(numAmount);
        return this.applyPrefix(formatted, nombreTipoMoneda);
    }

    /**
     * Get Intl.NumberFormat options based on currency
     */
    private getFormatOptions(nombreTipoMoneda: string): Intl.NumberFormatOptions {
        if (nombreTipoMoneda === 'CLP') {
            // CLP has no decimal places
            return { maximumFractionDigits: 0 };
        }
        // USD and UF use 2 decimal places
        return {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };
    }

    /**
     * Apply currency prefix/suffix symbol
     */
    private applyPrefix(formatted: string, nombreTipoMoneda: string): string {
        switch (nombreTipoMoneda) {
            case 'USD':
                return `$ ${formatted} USD`;
            case 'UF':
                return `${formatted} UF`;
            case 'CLP':
                return `$ ${formatted}`;
            default:
                return formatted;
        }
    }
}
