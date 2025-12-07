import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotizacionesList } from './cotizaciones-list';

describe('CotizacionesList', () => {
  let component: CotizacionesList;
  let fixture: ComponentFixture<CotizacionesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CotizacionesList],
    }).compileComponents();

    fixture = TestBed.createComponent(CotizacionesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
