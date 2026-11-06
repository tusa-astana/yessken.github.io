import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import { AdminAnalyticsComponent } from './admin-analytics.component';

describe('AdminAnalyticsComponent', () => {
  let fixture: ComponentFixture<AdminAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: EventsApiService, useValue: { getAdminFunnelSummary: () => of([{ name: 'community_open', count: 4 }]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAnalyticsComponent);
    TestBed.inject(I18nService).setLocale('ru');
    fixture.detectChanges();
  });

  it('shows community outbound clicks as actions, not membership', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Переходы в сообщества');
    expect(element.textContent).toContain('4');
    expect(element.textContent).toContain('не число вступивших участников');
  });

  it('shows meetup share intents and deep-link opens as separate funnel steps', () => {
    fixture.componentInstance.summary.set([
      { name: 'meetup_share_intent', count: 6 },
      { name: 'meetup_invite_open', count: 3 },
    ]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Отправки планов');
    expect(element.textContent).toContain('Открытия приглашений');
    expect(element.textContent).toContain('6');
    expect(element.textContent).toContain('3');
  });

  it('translates pilot analytics when the global locale changes', () => {
    TestBed.inject(I18nService).setLocale('en');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Pilot analytics');
    expect(element.textContent).toContain('Community link clicks');
    expect(element.textContent).toContain('not group joins');
  });
});