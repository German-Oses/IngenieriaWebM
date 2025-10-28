import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MensajeriaPage } from './mensajeria.page';

describe('MensajeriaPage', () => {
  let component: MensajeriaPage;
  let fixture: ComponentFixture<MensajeriaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MensajeriaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
