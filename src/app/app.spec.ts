import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';

@Component({ template: '' })
class RouteStubComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([
        { path: '', component: RouteStubComponent },
        { path: 'meetups', component: RouteStubComponent },
        { path: 'tg-groups', component: RouteStubComponent },
        { path: 'my-tickets', component: RouteStubComponent },
        { path: 'events/:id', component: RouteStubComponent },
      ])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand strong')?.textContent).toContain('TUSA');
  });

  it('exposes the selected interface language accessibly', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.lang-switcher')?.getAttribute('aria-label')).toBe('Язык интерфейса');
    expect(compiled.querySelector('.lang-switcher button[aria-pressed="true"]')?.textContent?.trim()).toBe('RU');
  });

  it('keeps the profile tab active on nested account routes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/my-tickets');
    fixture.detectChanges();

    const profileLink = (fixture.nativeElement as HTMLElement).querySelector('.bottom-nav a[href="/profile"]');
    expect(profileLink?.classList.contains('active')).toBe(true);
    expect(profileLink?.getAttribute('aria-current')).toBe('page');
  });

  it('keeps the events tab active on an event detail route', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/events/demo-event');
    fixture.detectChanges();

    const eventsLink = (fixture.nativeElement as HTMLElement).querySelector('.bottom-nav a[href="/events"]');
    expect(eventsLink?.classList.contains('active')).toBe(true);
    expect(eventsLink?.getAttribute('aria-current')).toBe('page');
  });

  it('keeps the Together tab active on the Telegram communities route', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/tg-groups');
    fixture.detectChanges();

    const togetherLink = (fixture.nativeElement as HTMLElement).querySelector('.bottom-nav a[href="/meetups"]');
    expect(togetherLink?.classList.contains('active')).toBe(true);
    expect(togetherLink?.getAttribute('aria-current')).toBe('page');
  });
});
