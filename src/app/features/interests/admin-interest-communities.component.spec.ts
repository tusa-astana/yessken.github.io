import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { InterestsApiService } from './interests-api.service';
import { AdminInterestCommunitiesComponent } from './admin-interest-communities.component';

const pendingCommunity = {
  id: 'community-1',
  title: 'Astana Reddit',
  description: 'Обсуждения города',
  platform: 'reddit' as const,
  url: 'https://www.reddit.com/r/Astana',
  createdAt: '2026-11-10T10:00:00Z',
  interests: ['Книги', 'Кофе и разговоры'],
};

describe('AdminInterestCommunitiesComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the queued community, selected interests, and external link', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInterestCommunitiesComponent],
      providers: [
        provideRouter([]),
        { provide: InterestsApiService, useValue: { loadPendingCommunities: vi.fn(async () => [pendingCommunity]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminInterestCommunitiesComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.community-card')?.textContent).toContain('Astana Reddit');
    expect(element.querySelector('.interests')?.textContent).toContain('Книги · Кофе и разговоры');
    expect(element.querySelector<HTMLAnchorElement>('.community-card > a')?.href).toBe(pendingCommunity.url);
    fixture.destroy();
  });

  it('removes a reviewed community from the queue and announces publication', async () => {
    const reviewCommunity = vi.fn(async () => true);
    await TestBed.configureTestingModule({
      imports: [AdminInterestCommunitiesComponent],
      providers: [
        provideRouter([]),
        { provide: InterestsApiService, useValue: {
          loadPendingCommunities: vi.fn(async () => [pendingCommunity]),
          reviewCommunity,
        } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminInterestCommunitiesComponent);
    await fixture.whenStable();

    await fixture.componentInstance.review(pendingCommunity, 'approve');
    fixture.detectChanges();

    expect(reviewCommunity).toHaveBeenCalledWith('community-1', 'approve');
    expect(fixture.componentInstance.communities()).toEqual([]);
    expect(fixture.componentInstance.announcement()).toContain('опубликовано');
    fixture.destroy();
  });
});