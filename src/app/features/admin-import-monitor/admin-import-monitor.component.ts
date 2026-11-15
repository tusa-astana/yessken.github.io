import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImportSchedulerService, ImportResult } from '../../core/services/import-scheduler.service';

@Component({
  selector: 'app-admin-import-monitor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-import-monitor.component.html',
  styleUrl: './admin-import-monitor.component.scss',
})
export class AdminImportMonitorComponent {
  readonly scheduler = inject(ImportSchedulerService);

  readonly results = this.scheduler.lastResults;
  readonly lastRunAt = this.scheduler.lastRunAt;
  readonly isImporting = this.scheduler.isImporting;

  readonly showDetails = signal<string | null>(null);

  runNow(): void {
    void this.scheduler.runNow();
  }

  totalImported(): number {
    return this.results().reduce((sum, r) => sum + r.imported, 0);
  }

  totalFetched(): number {
    return this.results().reduce((sum, r) => sum + r.fetched, 0);
  }

  totalErrors(): number {
    return this.results().filter((r) => !!r.error).length;
  }

  toggleDetails(sourceId: string): void {
    this.showDetails.set(this.showDetails() === sourceId ? null : sourceId);
  }

  hasError(result: ImportResult): boolean {
    return !!result.error;
  }

  formatTime(iso: string | null): string {
    if (!iso) return 'Еще не запускался';
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}