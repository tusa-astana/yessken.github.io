import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TelegramService } from '../../core/services/telegram.service';
import { MeetupsApiService } from './meetups-api.service';
import type { MeetupPlan } from './meetup.model';
import { MeetupsComponent } from './meetups.component';

const plan: MeetupPlan = {
  id: 'venue-1',
  venue: 'Test Venue',
  type: 'bar',
  address: 'Astana',
  lat: null,
  lng: null,
  mapUrl: 'https://example.com',
  featured: false,
  date: '2026-11-06',
  goingCount: 0,
  openToMeetCount: 0,
  userGoing: false,
  attendees: [],
};

describe('MeetupsComponent privacy defaults', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetupsComponent],
      providers: [
        provideRouter([]),
        { provide: MeetupsApiService, useValue: {
          plans: signal([]),
          loading: signal(false),
          loaded: signal(true),
          error: signal(false),
          sourceUpdatedAt: signal(null),
          load: async () => undefined,
        } },
        { provide: TelegramService, useValue: { isInTelegram: true } },
      ],
    }).compileComponents();
  });

  it('defaults new attendance to anonymous', () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.componentInstance.openJoin(plan);

    expect(fixture.componentInstance.draftAnonymous()).toBe(true);
    expect(fixture.componentInstance.draftOpenToMeet()).toBe(false);
  });

  it('preserves an existing explicit choice when editing attendance', () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    const existing = {
      ...plan,
      userGoing: true,
      attendees: [{ id: 'you', name: 'You', time: '20:30', anonymous: false, openToMeet: true, isYou: true }],
    };
    fixture.componentInstance.openJoin(existing);

    expect(fixture.componentInstance.draftAnonymous()).toBe(false);
    expect(fixture.componentInstance.draftOpenToMeet()).toBe(true);
  });

  it('links the Together page to local Telegram communities', () => {
    const fixture = TestBed.createComponent(MeetupsComponent);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.groups-shortcut');
    expect(link?.getAttribute('href')).toBe('/tg-groups');
    expect(link?.textContent).toContain('Telegram-сообщества');
    fixture.destroy();
  });
});
