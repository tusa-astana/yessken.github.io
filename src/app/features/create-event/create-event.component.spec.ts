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
});
