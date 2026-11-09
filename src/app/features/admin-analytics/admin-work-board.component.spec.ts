import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventsApiService } from '../../core/services/events-api.service';
import { I18nService } from '../../core/services/i18n.service';
import { TelegramService } from '../../core/services/telegram.service';
import { AdminWorkBoardComponent } from './admin-work-board.component';

describe('AdminWorkBoardComponent', () => {
  let fixture: ComponentFixture<AdminWorkBoardComponent>;
  const boardMarkdown = `# TUSA task board

## Active blocks

| ID | Task | Status | Next step |
|---|---|---|---|
| TUSA-01 | Analytics | In progress | Verify tests |
| TUSA-02 | Bot payment | Blocked | Resolve dependency |

## Deferred

| ID | Task | Reason |
|---|---|---|
| TUSA-03 | Organizer Pro | Price remains 0 |
`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkBoardComponent],
      providers: [
        provideRouter([]),
        { provide: EventsApiService, useValue: {
          getAdminFunnelSummary: () => of([{ name: 'catalog_view', count: 1 }]),
          getAdminWorkBoard: () => of(boardMarkdown),
        } },
        { provide: TelegramService, useValue: { miniAppLink: (startParam: string) => `https://t.me/tusa_astana_bot?startapp=${startParam}` } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminWorkBoardComponent);
    TestBed.inject(I18nService).setLocale('ru');
  });

  it('loads the repository board only after admin analytics access is confirmed', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Доска задач TUSA');
    expect(element.textContent).toContain('TUSA-01');
    expect(element.textContent).toContain('TUSA-02');
    expect(element.textContent).toContain('TUSA-03');
    expect(element.querySelectorAll('table')).toHaveLength(2);
    expect(element.querySelector<HTMLAnchorElement>('.tabs a[href="/admin/analytics/board"]')?.textContent).toContain('Доска задач');
  });

  it('does not request or render the board when the server denies admin access', async () => {
    const api = TestBed.inject(EventsApiService);
    vi.spyOn(api, 'getAdminFunnelSummary').mockReturnValue(of(null));
    const getBoard = vi.spyOn(api, 'getAdminWorkBoard');

    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Нужен доступ администратора TUSA');
    expect(getBoard).not.toHaveBeenCalled();
    expect(element.textContent).not.toContain('TUSA-01');
  });
});
