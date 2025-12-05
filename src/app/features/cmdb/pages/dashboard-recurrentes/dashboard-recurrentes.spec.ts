import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRecurrentes } from './dashboard-recurrentes';

describe('DashboardRecurrentes', () => {
  let component: DashboardRecurrentes;
  let fixture: ComponentFixture<DashboardRecurrentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardRecurrentes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRecurrentes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
