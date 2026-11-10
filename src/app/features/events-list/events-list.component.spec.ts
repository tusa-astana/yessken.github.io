import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DataService } from '../../core/services/data.service';
import type { EventItem } from '../../core/types/event.model';
import { EventsListComponent } from './events-list.component';

describe('EventsListComponent', () => {
  let fixture: ComponentFixture<EventsListComponent>;

  beforeEach(async () => {
    window.localStorage.removeItem('tusa-locale-preference-v1');
    await TestBed.configureTestingModule({
      imports: [EventsListComponent],
      providers: [
        provideRouter([]),
        { provide: DataService, useValue: { getEvents: () => of([]), getPastEvents: () => of([]), eventsError: signal(false) } },
        { provide: AnalyticsService, useValue: { track: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsListComponent);
    fixture.detectChanges();
  });

  it('links from the event discovery page to hobbies and clubs', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.hobbies-link');

    expect(link?.getAttribute('href')).toBe('/interests?group=board-games');
    expect(link?.textContent).toContain('Хобби и клубы');
  });

  it('switches to the past-events archive and requests its records', () => {
    const pastEvent: EventItem = {
      id: 'past-event', title: 'Past event', description: '', date: '2026-11-09', time: '19:00',
      place: 'Astana venue', address: '', lat: 0, lng: 0, category: 'concert', price: null,
      imageUrl: '', organizerName: 'Organizer',
    };
    const data = TestBed.inject(DataService) as unknown as { getPastEvents: ReturnType<typeof vi.fn> };
    data.getPastEvents = vi.fn(() => of([pastEvent]));

    const archiveButton = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.event-view-switch button')[1];
    archiveButton.click();
    fixture.detectChanges();

    expect(data.getPastEvents).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.historyView()).toBe(true);
    expect(fixture.componentInstance.events()).toEqual([pastEvent]);
  });

  it('ranks title matches ahead of description-only matches, then by event date', () => {
    const event = (id: string, title: string, description: string, date: string): EventItem => ({
      id,
      title,
      description,
      date,
      time: '19:00',
      place: 'Astana venue',
      address: 'Astana',
      lat: 51.1694,
      lng: 71.4494,
      category: 'concert',
      price: null,
      imageUrl: '',
      organizerName: 'Organizer',
    });

    fixture.componentInstance.events.set([
      event('description', 'Evening plan', 'Jazz meetup', '2026-12-01'),
      event('later-title', 'Jazz evening', '', '2026-12-10'),
      event('earlier-title', 'Jazz workshop', '', '2026-12-05'),
    ]);
    fixture.componentInstance.searchQuery = 'jazz';

    expect(fixture.componentInstance.filteredEvents().map((item) => item.id))
      .toEqual(['earlier-title', 'later-title', 'description']);
  });

  it('labels paid event promotion as advertising in the discovery card', () => {
    fixture.componentInstance.events.set([{
      id: 'sponsored-event',
      title: 'Sponsored event',
      description: '',
      date: '2026-12-01',
      time: '19:00',
      place: 'Astana venue',
      address: 'Astana',
      lat: 51.1694,
      lng: 71.4494,
      category: 'concert',
      price: null,
      imageUrl: '',
      organizerName: 'Organizer',
      featured: true,
    }]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.featured-badge')?.textContent?.trim())
      .toBe('РЕКЛАМА');
  });

  it('shows a designed fallback instead of a broken image when an event has no cover', () => {
    fixture.componentInstance.events.set([{
      id: 'no-cover', title: 'Тартюф', description: '', date: '2099-11-11', time: '19:00',
      place: 'Астана Опера', address: '', lat: 0, lng: 0, category: 'Спектакль', price: null,
      imageUrl: '', organizerName: 'Астана Опера',
    }]);
    fixture.detectChanges();

    const media = (fixture.nativeElement as HTMLElement).querySelector('.card-media');
    expect(media?.querySelector('img')).toBeNull();
    expect(media?.querySelector('.image-fallback')?.textContent).toContain('Спектакль');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Тартюф');
  });

  it('replaces an unavailable remote cover with the fallback', () => {
    fixture.componentInstance.events.set([{
      id: 'unavailable-cover', title: 'Тартюф', description: '', date: '2099-11-11', time: '19:00',
      place: 'Астана Опера', address: '', lat: 0, lng: 0, category: 'Спектакль', price: null,
      imageUrl: 'https://images.example.org/poster.jpg', organizerName: 'Астана Опера',
    }]);
    fixture.detectChanges();

    const image = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('.card-media img');
    expect(image).not.toBeNull();
    image?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const media = (fixture.nativeElement as HTMLElement).querySelector('.card-media');
    expect(media?.querySelector('img')).toBeNull();
    expect(media?.querySelector('.image-fallback')).not.toBeNull();
  });
});