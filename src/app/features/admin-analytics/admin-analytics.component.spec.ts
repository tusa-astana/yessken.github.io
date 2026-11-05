import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventsApiService } from '../../core/services/events-api.service';
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
    fixture.detectChanges();
  });

  it('shows community outbound clicks as actions, not membership', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Переходы в сообщества');
    expect(element.textContent).toContain('4');
    expect(element.textContent).toContain('не число вступивших участников');
  });
});