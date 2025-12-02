import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatRut',
    standalone: true
})
export class FormatRutPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '';

        // Remove any existing formatting
        const cleaned = value.replace(/[.-]/g, '');

        // Extract the verification digit (last character)
        if (cleaned.length < 2) return value;

        const rut = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);

        // Format: XX.XXX.XXX-K
        if (rut.length === 0) return value;

        const formatted = rut.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formatted}-${dv}`;
    }
}
