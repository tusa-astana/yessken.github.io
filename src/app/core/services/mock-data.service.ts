import { Injectable } from '@angular/core';
import { EventItem, Ticket } from '../types/event.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private demoDate(daysAhead: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private events: EventItem[] = [
    {
      id: '1',
      title: 'Ночной концерт в столице',
      description: 'Живая музыка, бар, танцы до утра. Возраст 18+.',
      date: this.demoDate(1),
      time: '22:00',
      place: 'Клуб «Астана»',
      address: 'ул. Кенесары, 40',
      lat: 51.1605,
      lng: 71.4704,
      category: 'концерт',
      price: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'Астана Events',
      isDemo: true,
      ticketCategories: [
        { id: '1-standard', eventId: '1', name: 'Стандарт', description: 'Обычный вход', price: 3500, capacity: 300, sold: 46, isActive: true },
        { id: '1-vip', eventId: '1', name: 'VIP', description: 'Отдельная зона и быстрый вход', price: 7000, capacity: 40, sold: 8, isActive: true },
      ],
    },
    {
      id: '2',
      title: 'Джаз под звёздами',
      description: 'Открытая площадка, джаз-бэнд, коктейли.',
      date: this.demoDate(3),
      time: '20:00',
      place: 'Парк Первого Президента',
      address: 'пр. Республики',
      lat: 51.1252,
      lng: 71.4305,
      category: 'концерт',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'Jazz Astana',
      isDemo: true,
      ticketCategories: [{ id: '2-entry', eventId: '2', name: 'Вход', description: 'Свободная регистрация', price: 0, capacity: 500, sold: 120, isActive: true }],
    },
    {
      id: '3',
      title: 'Техно-вечеринка',
      description: 'DJ-сет, два этажа, лаунж и танцпол.',
      date: this.demoDate(5),
      time: '23:00',
      place: 'Лофт «Сходка»',
      address: 'ул. Сыганак, 12',
      lat: 51.1694,
      lng: 71.4494,
      category: 'вечеринка',
      price: 5000,
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'Loft Club',
      isDemo: true,
      ticketCategories: [
        { id: '3-dance', eventId: '3', name: 'Танцпол', description: 'Основная зона', price: 5000, capacity: 250, sold: 73, isActive: true },
        { id: '3-vip', eventId: '3', name: 'VIP', description: 'Комфортная зона', price: 10000, capacity: 30, sold: 5, isActive: true },
      ],
    },
    {
      id: '4',
      title: 'Stand-up вечер',
      description: 'Стендап комики из Астаны и Алматы.',
      date: this.demoDate(7),
      time: '19:00',
      place: 'Театр «Жастар»',
      address: 'ул. Есенберлина, 10',
      lat: 51.1489,
      lng: 71.4369,
      category: 'развлечения',
      price: 2500,
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'Comedy Astana',
      isDemo: true,
      ticketCategories: [{ id: '4-standard', eventId: '4', name: 'Стандарт', description: 'Место в зале', price: 2500, capacity: 180, sold: 31, isActive: true }],
    },
    {
      id: '5',
      title: 'TUSA Night Market',
      description: 'Локальные бренды, уличная еда, музыка и мастер-классы до позднего вечера.',
      date: this.demoDate(9),
      time: '18:30',
      place: 'Район Музейная площадь',
      address: 'ул. Тауелсиздик, 14',
      lat: 51.1284,
      lng: 71.4312,
      category: 'выставка',
      price: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'City Makers',
      isDemo: true,
      ticketCategories: [
        { id: '5-entry', eventId: '5', name: 'Вход', description: 'Доступ ко всем зонам', price: 1200, capacity: 220, sold: 64, isActive: true },
        { id: '5-fast', eventId: '5', name: 'Fast Track', description: 'Быстрый вход и напиток', price: 2600, capacity: 40, sold: 12, isActive: true },
      ],
    },
    {
      id: '6',
      title: 'Фестиваль спорта и wellness',
      description: 'Йога, фитнес-демо, локальные бренды и открытая зона для семейного отдыха.',
      date: this.demoDate(12),
      time: '10:00',
      place: 'Парк культуры',
      address: 'ул. Сакена Сейфуллина, 8',
      lat: 51.1418,
      lng: 71.4029,
      category: 'спорт',
      price: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'Move Astana',
      isDemo: true,
      ticketCategories: [
        { id: '6-standard', eventId: '6', name: 'Стандарт', description: 'Посещение фестиваля', price: 1500, capacity: 350, sold: 92, isActive: true },
        { id: '6-pass', eventId: '6', name: 'Family Pass', description: 'Два взрослых + ребенок', price: 4200, capacity: 60, sold: 14, isActive: true },
      ],
    },
    {
      id: '7',
      title: 'Клубный brunch с диджеями',
      description: 'Утренний brunch, живой сет и атмосферный лофт в центре города.',
      date: this.demoDate(16),
      time: '12:00',
      place: 'Лофт «Северный»',
      address: 'пр. Мангилик Ел, 55',
      lat: 51.1589,
      lng: 71.4552,
      category: 'брunch',
      price: 3200,
      imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85',
      organizerName: 'Brunch Society',
      isDemo: true,
      ticketCategories: [{ id: '7-entry', eventId: '7', name: 'Билет', description: 'Вход + завтрак', price: 3200, capacity: 160, sold: 44, isActive: true }],
    },
  ];

  /** В моках: какие сходки «текущий пользователь» отметил «Я пойду» */
  private userGoingEventIds = new Set<string>(['1', '5']);

  private tickets: Ticket[] = [
    {
      id: 't1',
      eventId: '1',
      eventTitle: 'Ночной концерт в столице',
      eventDate: this.demoDate(1),
      eventPlace: 'Клуб «Астана»',
      qrCode: 'TUSA-T1-XXXX',
      purchasedAt: '2026-03-01T12:00:00',
      paymentMethod: 'telegram',
      paymentStatus: 'paid',
      quantity: 1,
      totalAmount: 3500,
      isDemo: true,
    },
    {
      id: 't2',
      eventId: '5',
      eventTitle: 'TUSA Night Market',
      eventDate: this.demoDate(9),
      eventPlace: 'Район Музейная площадь',
      qrCode: 'TUSA-T2-FAST',
      purchasedAt: '2026-03-10T18:50:00',
      paymentMethod: 'telegram_provider',
      paymentStatus: 'paid',
      ticketCategoryName: 'Fast Track',
      quantity: 2,
      totalAmount: 5200,
      isDemo: true,
    },
    {
      id: 't3',
      eventId: '6',
      eventTitle: 'Фестиваль спорта и wellness',
      eventDate: this.demoDate(12),
      eventPlace: 'Парк культуры',
      qrCode: 'TUSA-T3-pass',
      purchasedAt: '2026-03-11T09:12:00',
      paymentMethod: 'telegram',
      paymentStatus: 'checkout',
      ticketCategoryName: 'Family Pass',
      quantity: 1,
      totalAmount: 4200,
      isDemo: true,
    },
  ];

  constructor() {
    if (typeof window === 'undefined') return;
    const savedEvents = window.localStorage.getItem('tusa-events');
    if (savedEvents) {
      try {
        const events = JSON.parse(savedEvents) as EventItem[];
        if (Array.isArray(events)) {
          const demoEvents = events.map((event) => ({ ...event, isDemo: true, ticketSalesEnabled: false }));
          this.events = [...this.events, ...demoEvents.filter((saved) => !this.events.some((event) => event.id === saved.id))];
        }
      } catch {
        window.localStorage.removeItem('tusa-events');
      }
    }
    const saved = window.localStorage.getItem('tusa-tickets');
    if (!saved) return;
    try {
      const tickets = JSON.parse(saved) as Ticket[];
      if (Array.isArray(tickets)) this.tickets = tickets;
    } catch {
      window.localStorage.removeItem('tusa-tickets');
    }
  }

  getEvents(): EventItem[] {
    return [...this.events];
  }

  getEventById(id: string): EventItem | undefined {
    const ev = this.events.find((e) => e.id === id);
    if (!ev) return ev;
    const userGoing = this.userGoingEventIds.has(id);
    return { ...ev, goingCount: userGoing ? 1 : 0, userGoing };
  }

  setGoing(eventId: string): { goingCount: number; userGoing: boolean } {
    if (this.userGoingEventIds.has(eventId)) {
      this.userGoingEventIds.delete(eventId);
      return { goingCount: 0, userGoing: false };
    }
    this.userGoingEventIds.add(eventId);
    return { goingCount: 1, userGoing: true };
  }

  getTickets(): Ticket[] {
    return this.tickets.map((ticket) => ({ ...ticket, isDemo: true }));
  }

  addEvent(event: Omit<EventItem, 'id'>): EventItem {
    const newEvent: EventItem = {
      ...event,
      id: String(this.events.length + 1),
      isDemo: true,
      ticketSalesEnabled: false,
    };
    this.events.push(newEvent);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tusa-events', JSON.stringify(this.events));
    }
    return newEvent;
  }

  addTicket(ticket: Omit<Ticket, 'id' | 'purchasedAt'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: 't' + (this.tickets.length + 1),
      purchasedAt: new Date().toISOString(),
      isDemo: true,
    };
    this.tickets.push(newTicket);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tusa-tickets', JSON.stringify(this.tickets));
    }
    return newTicket;
  }
}
