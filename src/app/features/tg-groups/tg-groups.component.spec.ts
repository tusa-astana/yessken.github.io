import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TelegramService } from '../../core/services/telegram.service';
import { TgGroupsComponent } from './tg-groups.component';

describe('TgGroupsComponent', () => {
  let fixture: ComponentFixture<TgGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TgGroupsComponent],
      providers: [
        { provide: TelegramService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TgGroupsComponent);
    fixture.detectChanges();
  });

  it('shows the RollMove community with its public Telegram link', () => {
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('.join');

    expect(element.querySelector('.title')?.textContent).toContain('Кинь-Двинь');
    expect(link?.getAttribute('href')).toBe('https://t.me/RollMove');
    expect(element.querySelector('.count')).toBeNull();
  });
});