import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { InterestsApiService } from './interests-api.service';
import { AdminInterestReportsComponent } from './admin-interest-reports.component';

const report = {
  id: 'report-1',
  interestId: 'board-games',
  interestName: 'Настольные игры',
  reason: 'unsafe' as const,
  details: '',
  createdAt: '2026-11-07T10:00:00Z',
  reporterTelegramUserId: 101,
  reporterName: 'Reporter',
  reporterUsername: null,
  targetTelegramUserId: 202,
  targetName: 'Target',
  targetUsername: null,
  targetSuspended: false,
};

describe('AdminInterestReportsComponent', () => {
  let fixture: ComponentFixture<AdminInterestReportsComponent>;
  const reviewReport = vi.fn(async () => true);

  beforeEach(async () => {
    reviewReport.mockClear();
    await TestBed.configureTestingModule({
      imports: [AdminInterestReportsComponent],
      providers: [
        provideRouter([]),
        { provide: InterestsApiService, useValue: {
          loadReports: vi.fn(async () => [report]),
          reviewReport,
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminInterestReportsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('explains suspension side effects before confirmation and reports them after success', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const suspendButton = [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Ограничить аккаунт'));
    expect(suspendButton).toBeDefined();
    suspendButton?.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('его активные встречи отменятся, а RSVP удалятся');
    expect(reviewReport).not.toHaveBeenCalled();

    const confirmButton = [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Подтвердить'));
    confirmButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(reviewReport).toHaveBeenCalledWith('report-1', 'suspend');
    expect(element.querySelector('[role="status"]')?.textContent)
      .toContain('активные встречи отменены, RSVP удалены');
  });
});