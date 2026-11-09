import { TestBed } from '@angular/core/testing';
import { DataService } from '../../core/services/data.service';
import { CreateEventComponent } from './create-event.component';

describe('CreateEventComponent', () => {
  const data = {
    eventSubmissionRateLimited: () => false,
    createEvent: () => { throw new Error('Invalid form must not be submitted'); },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEventComponent],
      providers: [{ provide: DataService, useValue: data }],
    }).compileComponents();
  });

  it('lets an invalid form submit attempt reveal validation messages without sending it', async () => {
    const fixture = TestBed.createComponent(CreateEventComponent);
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector('.submit-panel button') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    submit.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.componentInstance.form;
    const compiled = fixture.nativeElement as HTMLElement;
    expect(form.invalid).toBe(true);
    expect(compiled.querySelector('#title-error')?.textContent).toContain('название');
    expect(compiled.querySelector('#date-error')?.textContent).toContain('дату');
    expect(compiled.querySelector('#place-error')?.textContent).toContain('площадку');
    expect(compiled.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });

  it('accepts an optional HTTPS ticket distributor URL and rejects non-HTTPS links', () => {
    const fixture = TestBed.createComponent(CreateEventComponent);
    const form = fixture.componentInstance.form;

    expect(form.get('ticketUrl')?.valid).toBe(true);
    form.get('ticketUrl')?.setValue('http://tickets.example.com/event');
    expect(form.get('ticketUrl')?.valid).toBe(false);
    form.get('ticketUrl')?.setValue('https://tickets.example.com/event');
    expect(form.get('ticketUrl')?.valid).toBe(true);
    expect(form.hasError('ticketSellerLinkPairRequired')).toBe(true);
    form.get('ticketSellerName')?.setValue('Official distributor');
    expect(form.hasError('ticketSellerLinkPairRequired')).toBe(false);
    form.get('ticketUrl')?.setValue('');
    expect(form.hasError('ticketSellerLinkPairRequired')).toBe(true);
    fixture.destroy();
  });
});
