import { Injectable, effect, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.initialTheme());
  readonly isDark = () => this.theme() === 'dark';

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (typeof document !== 'undefined') {
        document.documentElement.dataset['theme'] = theme;
        document.documentElement.style.colorScheme = theme;
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tusa-theme-preference-v1', theme);
      }
    });
  }

  toggle(): void {
    this.theme.update((theme) => theme === 'light' ? 'dark' : 'light');
  }

  private initialTheme(): AppTheme {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('tusa-theme-preference-v1');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  }
}
