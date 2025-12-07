# Architecture and Refactor Notes

This document summarizes the architectural principles and recent refactoring decisions applied in this repository.

## Principles

- **Single Responsibility (SRP)**: each service/component has a focused responsibility. Expiry and currency logic were extracted to `ExpiryService` and `CurrencyService`.
- **Separation of concerns**: domain models are centralized under `src/app/core/models` to avoid duplication and improve discoverability.
- **Utilities**: pure, deterministic functions live under `src/app/core/utils` (e.g., RUT helpers).
- **Pragmatic modularization**: standalone components, services with `providedIn: 'root'`, small focused files.
- **Barrel exports**: `src/app/core/models/index.ts` re-exports all models for consistent, simplified imports across the app.

## Patterns

- **Dual-load pattern**: for paginated tables, maintain paginated data for UI while loading full dataset separately for aggregations (totals), preserving pagination state.
- **Service-first domain logic**: business logic belongs in services; components remain thin and focused on presentation.
- **Models barrel**: all imports of domain types use `src/app/core/models` barrel instead of individual files, reducing import path complexity.

## Models Structure

All domain interfaces and types live in `src/app/core/models/`:

| File | Purpose |
|------|---------|
| `contrato.model.ts` | `IContrato`, `IPaginatedContratoResponse` |
| `cotizacion.model.ts` | `ICotizacionDetalle`, `IPaginatedCotizacionResponse` |
| `dashboard.model.ts` | `DashboardContrato` |
| `expiry.model.ts` | `ExpiryInfo` (expiry status data) |
| `filter.model.ts` | `ContratoFilters`, `DEFAULT_CONTRATO_FILTERS` |
| `totals.model.ts` | `Totals`, `EMPTY_TOTALS` |
| `index.ts` | Barrel export of all models |

### Naming Conventions

- Interfaces representing entity/domain models use prefix `I` (e.g., `IContrato`, `ICotizacionDetalle`).
- Response DTOs include context in the name (e.g., `IPaginatedContratoResponse` vs `IPaginatedCotizacionResponse`).
- Local component interfaces that don't need to be shared remain inside the component file (e.g., `ISummaryRow` in `dashboard-recurrentes.ts`).

## Import Pattern

**Before:**
```typescript
import { IContrato } from '../../../../core/models/contrato.model';
import { ContratoFilters } from '../../../../core/models/filter.model';
```

**After:**
```typescript
import { IContrato, ContratoFilters } from '../../../../core/models';
```

This reduces import clutter and makes refactoring easier if model files are reorganized.

## Services Architecture

Services handle domain logic and state management:

| Service | Responsibility |
|---------|-----------------|
| `ContratosService` | Load, filter, paginate contracts; dual-load for totals |
| `CotizacionesService` | Load and paginate quotation details |
| `DashboardService` | Fetch dashboard aggregation data |
| `ExpiryService` | Calculate expiry dates, severity, colors; pure functions |
| `CurrencyService` | Format amounts by currency and locale |

## Utilities

Pure functions live in `src/app/core/utils/`:

- `rut.utils.ts`: RUT validation, formatting, character validation (consolidated from 2 previous files, reduced duplication by 56%).

## Code Organization Summary

**Total refactoring impact:**
- Moved 6 exported interfaces to `core/models` (centralized types).
- Created barrel `index.ts` for simplified imports.
- Extracted 3 services (`ExpiryService`, `CurrencyService`, `DashboardService`).
- Consolidated RUT utilities: 178 lines → 79 lines (56% reduction).
- Renamed interfaces for consistency: `CotizacionDetalle` → `ICotizacionDetalle`, `SummaryRow` → `ISummaryRow`.
- Renamed response interface: `IPaginatedResponse` → `IPaginatedContratoResponse` (clarity).

## When to Add New Models

1. Create a new file under `src/app/core/models/` named `{domain}.model.ts`.
2. Export the interface with `I` prefix if it's a domain entity.
3. Add it to `src/app/core/models/index.ts` barrel.
4. Import via barrel: `import { IYourType } from '../../../../core/models';`

## Future Considerations

- **TotalsService**: if totals calculation logic grows, extract to a dedicated service.
- **Unit tests**: add comprehensive tests for `rut.utils.ts`, `ExpiryService`, `CurrencyService`.
- **Type guards**: consider adding runtime type validation for critical DTOs from backend API.

