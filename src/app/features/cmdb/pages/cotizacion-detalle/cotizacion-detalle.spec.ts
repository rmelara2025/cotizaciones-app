import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CotizacionDetalle } from './cotizacion-detalle';

describe('CotizacionDetalle', () => {
  let component: CotizacionDetalle;
  let fixture: ComponentFixture<CotizacionDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CotizacionDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CotizacionDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
