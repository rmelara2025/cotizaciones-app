import { Pipe, PipeTransform } from '@angular/core';
import { formatRut as formatRutUtil } from '../utils/rut.utils';

@Pipe({
    name: 'formatRut',
    standalone: true
})
export class FormatRutPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '';
        return formatRutUtil(value);
    }
}
