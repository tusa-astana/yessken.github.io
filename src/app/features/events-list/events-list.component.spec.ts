import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DataService } from '../../core/services/data.service';
import { EventsListComponent } from './events-list.component';

describe('EventsListComponent', () => {
  let fixture: ComponentFixture<EventsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsListComponent],
      providers: [
        provideRouter([]),
        { provide: DataService, useValue: { getEvents: () => of([]), eventsError: signal(false) } },
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
});