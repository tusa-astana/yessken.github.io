import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { EventSourcesApiService, type EventSourceCandidate } from './event-sources-api.service';
import { AdminEventSourcesComponent } from './admin-event-sources.component';

const candidate: EventSourceCandidate = {
  id: 'candidate-1', sourceId: 'kazequestrian-rss', sourceName: 'Федерация конного спорта Казахстана',
  externalId: 'entry-1', sourceUrl: 'https://kazequestrian.kz/en/archives/1203', title: 'Cup in Astana',
  summary: 'Official schedule', hobbyId: 'equestrian', eventDate: '2026-11-18', publishedAtUtc: '2026-11-06T09:00:10Z',
  eventTime: '10:00', eventPlace: 'Argymak Equestrian Complex', suggestedCategory: 'соревнование',
  importedAtUtc: '2026-11-10T00:00:00Z', status: 'pending', eventId: null,
};

describe('AdminEventSourcesComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('prefills parser hints and explains remaining review requirements instead of silently disabling draft creation', async () => {
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
    expect(fixture.componentInstance.form.controls.date.value).toBe('2026-11-18');
    expect(fixture.componentInstance.form.controls.time.value).toBe('10:00');
    expect(fixture.componentInstance.form.controls.place.value).toBe('Argymak Equestrian Complex');
    expect(fixture.componentInstance.form.controls.category.value).toBe('соревнование');
    expect(fixture.componentInstance.form.controls.description.value).toBe(candidate.summary);
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.form.controls.descriptionPermissionConfirmed.value).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.source-link')?.getAttribute('href'))
      .toBe(candidate.sourceUrl);
    const createButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.form-actions .primary');
    expect(createButton?.disabled).toBe(false);
    await fixture.componentInstance.convert(candidate);
    expect(convert).not.toHaveBeenCalled();
    expect(fixture.componentInstance.formError()).toContain('подтверждение разрешения');

    fixture.componentInstance.form.patchValue({
      date: '2026-11-18',
      place: 'Argymak Equestrian Complex',
      description: 'Проверенное своими словами описание турнира.',
      descriptionPermissionConfirmed: true,
      sourcePermissionConfirmed: true,
    });
    await fixture.componentInstance.convert(candidate);
    expect(convert).toHaveBeenCalledWith(candidate.id, expect.objectContaining({ hobbyId: 'equestrian', sourcePermissionConfirmed: true }));
    expect(fixture.componentInstance.announcement()).toContain('ещё не опубликовано');
    expect(fixture.componentInstance.candidates()?.[0]).toMatchObject({ status: 'converted', eventId: 'pending-event-1' });
    fixture.destroy();
  });

  it('creates a selected batch as pending drafts only after global review and required details', async () => {
    const convertBatch = vi.fn(async () => [{ candidateId: candidate.id, eventId: 'pending-event-2', status: 'pending' as const }]);
    await TestBed.configureTestingModule({
      imports: [AdminEventSourcesComponent],
      providers: [
        provideRouter([]),
        { provide: EventSourcesApiService, useValue: { loadPending: vi.fn(async () => [candidate]), convertBatch, convert: vi.fn(), dismiss: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminEventSourcesComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.startBatch();
    expect(component.selectedBatchCount()).toBe(1);
    expect(component.batchRows()[0]).toMatchObject({
      title: candidate.title, date: candidate.eventDate, time: '10:00',
      place: 'Argymak Equestrian Complex', category: 'соревнование', description: candidate.summary,
    });

    await component.convertBatch();
    expect(convertBatch).not.toHaveBeenCalled();
    expect(component.batchError()).toContain('Подтверди проверку');

    component.batchPermissionConfirmed.set(true);
    component.updateBatchField(candidate.id, 'place', { target: { value: 'Argymak Equestrian Complex' } } as unknown as Event);
    component.batchRows.update((rows) => rows.map((row) => row.id === candidate.id
      ? { ...row, imageUrl: 'data:image/webp;base64,UklGRg==', imagePermissionConfirmed: true, descriptionPermissionConfirmed: true }
      : row));
    await component.convertBatch();
    expect(convertBatch).toHaveBeenCalledWith(expect.objectContaining({
      sourcePermissionConfirmed: true,
      items: [expect.objectContaining({ candidateId: candidate.id, date: candidate.eventDate, place: 'Argymak Equestrian Complex', imageUrl: 'data:image/webp;base64,UklGRg==', imagePermissionConfirmed: true, descriptionPermissionConfirmed: true })],
    }));
    expect(component.candidates()?.[0]).toMatchObject({ status: 'converted', eventId: 'pending-event-2' });
    expect(component.announcement()).toContain('не опубликованы');
    fixture.destroy();
  });
});
