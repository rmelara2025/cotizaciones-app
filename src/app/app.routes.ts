import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'cotizaciones',
        loadChildren: () =>
            import('./features/cmdb/cmdb-module').then(m => m.CmdbModule)
    },
    {
        path: '',
        redirectTo: 'cotizaciones',
        pathMatch: 'full'
    }
];
