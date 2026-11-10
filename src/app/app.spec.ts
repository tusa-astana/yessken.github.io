import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App, routeFromStartParam } from './app';

@Component({ template: '' })
class RouteStubComponent {}

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.removeItem('tusa-locale-preference-v1');
    window.localStorage.removeItem('tusa-theme-preference-v1');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([
        { path: '', pathMatch: 'full', redirectTo: 'interests' },
        { path: 'interests', component: RouteStubComponent },
        { path: 'meetups', component: RouteStubComponent },
        { path: 'events', component: RouteStubComponent },
        { path: 'calendar', component: RouteStubComponent },
        { path: 'profile', component: RouteStubComponent },
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

  it('routes the admin analytics deep link to the dashboard', () => {
    expect(routeFromStartParam('admin_analytics')).toBe('/admin/analytics');
  });

  it('routes shared venue links to the selected map place and date', () => {
    expect(routeFromStartParam('meetup_bourbon-street-astana_20261106'))
      .toBe('/meetups?venue=bourbon-street-astana&date=2026-11-06');
    expect(routeFromStartParam('meetup_bourbon-street-astana_20260231')).toBeNull();
    expect(routeFromStartParam('meetup_bad%2Fvenue_20261106')).toBeNull();
  });

  it('preserves an allowlisted host campaign in a shared meetup link', () => {
    expect(routeFromStartParam('meetup_bourbon-street-astana_20261106_c_host-a'))
      .toBe('/meetups?venue=bourbon-street-astana&date=2026-11-06&campaign=host-a');
    expect(routeFromStartParam('meetup_bourbon-street-astana_20261106_c_unknown-host')).toBeNull();
  });

  it('routes a validated community gathering deep link to its exact plan', () => {
    expect(routeFromStartParam('gathering_0123456789abcdef0123456789abcdef'))
      .toBe('/interests?gathering=0123456789abcdef0123456789abcdef');
    expect(routeFromStartParam('gathering_unsafe%2Fid')).toBeNull();
  });

  it('lands visitors in Interests as the primary discovery experience and keeps Together one tap away', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/interests');
    const interestsLink = (fixture.nativeElement as HTMLElement).querySelector('.bottom-nav a[href="/interests"]');
    expect(interestsLink?.classList.contains('active')).toBe(true);
    expect(interestsLink?.getAttribute('aria-current')).toBe('page');
    const togetherLink = (fixture.nativeElement as HTMLElement).querySelector('.bottom-nav a[href="/meetups"]');
    expect(togetherLink?.textContent).toContain('Вместе');
    expect(togetherLink?.getAttribute('href')).toBe('/meetups');
    fixture.destroy();
  });

  it('should render the brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand strong')?.textContent).toContain('TUSA');
  });

  it('renders the decorative New Year garland without exposing it to assistive technology', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const garland = (fixture.nativeElement as HTMLElement).querySelector('.holiday-garland');
    expect(garland?.getAttribute('aria-hidden')).toBe('true');
    expect(garland?.querySelectorAll('.garland-bulb').length).toBe(14);
  });

  it('switches the festive palette between light and dark themes accessibly', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector<HTMLButtonElement>('.theme-toggle');

    expect(compiled.querySelector('.shell')?.classList.contains('dark-theme')).toBe(true);
    expect(toggle?.getAttribute('aria-label')).toBe('Включить светлую тему');

    toggle?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.shell')?.classList.contains('dark-theme')).toBe(false);
    expect(toggle?.getAttribute('aria-label')).toBe('Включить тёмную тему');

    toggle?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.shell')?.classList.contains('dark-theme')).toBe(true);
    fixture.destroy();
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
