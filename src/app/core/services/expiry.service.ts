import { Injectable } from '@angular/core';
import { IExpiryInfo } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ExpiryService {
    /**
     * Parse date string YYYY-MM-DD to Date object at midnight local time
     */
    private parseLocalDate(dateString: string): Date {
        const [y, m, d] = dateString.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    /**
     * Calculate days until expiry from a target date string
     */
    getDaysUntilExpiry(fechaTermino: string | null | undefined): number | null {
        if (!fechaTermino) return null;
        try {
            const term = this.parseLocalDate(fechaTermino);
            const termUTC = Date.UTC(term.getFullYear(), term.getMonth(), term.getDate());

            const now = new Date();
            const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

            const diffMs = termUTC - nowUTC;
            const msPerDay = 24 * 60 * 60 * 1000;

            return Math.round(diffMs / msPerDay);
        } catch (e) {
            console.warn('⚠️ Error calculating daysUntilExpiry for', fechaTermino, e);
            return null;
        }
    }

    /**
     * Calculate severity level based on days until expiry
     */
    getSeverity(days: number | null): 'high' | 'medium' | 'low' | null {
        if (days === null) return null;
        if (days <= 0) return 'high'; // Expired or expires today
        if (days <= 120) return 'medium'; // Within 4 months
        return 'low'; // More than 4 months
    }

    /**
     * Generate human-readable tooltip message
     */
    getTooltip(days: number | null): string {
        if (days == null) return 'Sin fecha';
        if (days < 0) return `Expirado hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
        if (days === 0) return 'Expira hoy';
        return `Expira en ${days} día${days === 1 ? '' : 's'}`;
    }

    /**
     * Get background color based on severity
     */
    getBackgroundColor(severity: 'high' | 'medium' | 'low' | null): string {
        const colorMap = {
            high: '#f8d7da', // light red
            medium: '#fff3cd', // light orange
            low: '#d1e7dd', // light green
            null: '#fff', // white
        };
        return colorMap[severity || 'null'] || '#fff';
    }

    /**
     * Get complete expiry info object in one call
     */
    getExpiryInfo(fechaTermino: string | null | undefined): IExpiryInfo {
        const days = this.getDaysUntilExpiry(fechaTermino);
        const severity = this.getSeverity(days);

        return {
            days,
            severity,
            tooltip: this.getTooltip(days),
            backgroundColor: this.getBackgroundColor(severity),
        };
    }
}
