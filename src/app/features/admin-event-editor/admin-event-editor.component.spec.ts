import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EventsApiService } from '../../core/services/events-api.service';
import type { AdminEditableEvent, UpdateAdminEventRequest } from '../../core/types/event.model';
import { AdminEventEditorComponent } from './admin-event-editor.component';

const event: AdminEditableEvent = {
  id: 'event-1',
  title: 'Winter concert',
  description: 'Live music',
  date: '2026-12-01',
  time: '19:00',
  place: 'Astana Hall',
  category: 'концерт',
  imageUrl: '',
  status: 'approved',
};

describe('AdminEventEditorComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads events and lets an admin save a manual HTTPS image URL', async () => {
    const api = {
      getAdminEvents: vi.fn(() => of([event])),
      updateAdminEvent: vi.fn((id: string, request: UpdateAdminEventRequest) =>
        of({ ...event, ...request, id, status: 'approved' as const })),
    };
    await TestBed.configureTestingModule({
      imports: [AdminEventEditorComponent],
      providers: [provideRouter([]), { provide: EventsApiService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminEventEditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Winter concert');
    fixture.componentInstance.edit(event);
    fixture.componentInstance.form.patchValue({ imageUrl: 'data:image/webp;base64,UklGRg==' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUploadedImage(fixture.componentInstance.form.controls.imageUrl.value)).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.edit-form input[inputmode="url"]')?.value).toBe('');
    fixture.componentInstance.form.patchValue({ imageUrl: 'https://cdn.example.org/poster.webp' });
    fixture.componentInstance.onImageUrlInput({ target: { value: 'https://cdn.example.org/poster.webp' } } as unknown as Event);
    fixture.detectChanges();
    fixture.componentInstance.save(event);
    expect(api.updateAdminEvent).not.toHaveBeenCalled();
    expect(fixture.componentInstance.imageError()).toContain('право размещать');
    fixture.componentInstance.imagePermissionConfirmed.set(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('figure.preview img')?.getAttribute('src'))
      .toBe('https://cdn.example.org/poster.webp');

    fixture.componentInstance.save(event);
    fixture.detectChanges();
    expect(api.updateAdminEvent).toHaveBeenCalledWith('event-1', expect.objectContaining({
      imageUrl: 'https://cdn.example.org/poster.webp',
      imagePermissionConfirmed: true,
      title: 'Winter concert',
    }));
    expect(fixture.componentInstance.events()?.[0].imageUrl).toBe('https://cdn.example.org/poster.webp');
    fixture.destroy();
  });
});
