import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { EventSourcesApiService, type EventSourceCandidate } from './event-sources-api.service';
import { AdminEventSourcesComponent } from './admin-event-sources.component';

const candidate: EventSourceCandidate = {
  id: 'candidate-1', sourceId: 'kazequestrian-rss', sourceName: 'Федерация конного спорта Казахстана',
  externalId: 'entry-1', sourceUrl: 'https://kazequestrian.kz/en/archives/1203', title: 'Cup in Astana',
  summary: 'Official schedule', hobbyId: 'equestrian', publishedAtUtc: '2026-11-06T09:00:10Z',
  importedAtUtc: '2026-11-10T00:00:00Z', status: 'pending', eventId: null,
};

describe('AdminEventSourcesComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('requires an editor to fill event date and place before converting an RSS candidate', async () => {
    const convert = vi.fn(async () => 'pending-event-1');
    await TestBed.configureTestingModule({
      imports: [AdminEventSourcesComponent],
      providers: [
        provideRouter([]),
        { provide: EventSourcesApiService, useValue: { loadPending: vi.fn(async () => [candidate]), convert, dismiss: vi.fn(async () => true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminEventSourcesComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.select(candidate);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.form.controls.description.value).toBe('');
    expect((fixture.nativeElement as HTMLElement).querySelector('.source-link')?.getAttribute('href'))
      .toBe(candidate.sourceUrl);

    fixture.componentInstance.form.patchValue({
      date: '2026-11-18',
      place: 'Argymak Equestrian Complex',
      description: 'Проверенное своими словами описание турнира.',
      sourcePermissionConfirmed: true,
    });
    await fixture.componentInstance.convert(candidate);
    expect(convert).toHaveBeenCalledWith(candidate.id, expect.objectContaining({ hobbyId: 'equestrian', sourcePermissionConfirmed: true }));
    expect(fixture.componentInstance.announcement()).toContain('ещё не опубликовано');
    expect(fixture.componentInstance.candidates()?.[0]).toMatchObject({ status: 'converted', eventId: 'pending-event-1' });
    fixture.destroy();
  });
});
