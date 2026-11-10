export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  place: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  hobbyId?: string;
  sourceUrl?: string;
  sourceVerifiedAtUtc?: string | null;
  price: number | null;
  imageUrl: string;
  isPublicEvent?: boolean;
  telegramSourceUrl?: string;
  ticketUrl?: string;
  ticketSellerName?: string;
  organizerName: string;
  organizerEmail?: string;
  organizerPhone?: string;
  organizerTelegramId?: number;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  isDemo?: boolean;
  ticketSalesEnabled?: boolean;
  featured?: boolean;
  featuredUntil?: string;
  /** Количество человек, которые нажали «Я пойду» (приходит с API) */
  goingCount?: number;
  /** Текущий пользователь нажал «Я пойду» (приходит с API) */
  userGoing?: boolean;
  ticketCategories?: TicketCategory[];
}

export interface AdminEditableEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  place: string;
  category: string;
  imageUrl: string;
  status: 'pending' | 'approved';
}

export type UpdateAdminEventRequest = Omit<AdminEditableEvent, 'id' | 'status'> & {
  imagePermissionConfirmed: boolean;
};

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  sold: number;
  isActive: boolean;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventPlace: string;
  qrCode?: string;
  purchasedAt: string;
  paymentMethod?: 'telegram' | 'telegram_provider';
  paymentStatus?: 'pending' | 'checkout' | 'paid' | 'failed' | 'expired' | 'refunded' | 'refund_requested';
  ticketCategoryId?: string;
  ticketCategoryName?: string;
  quantity?: number;
  baseAmount?: number;
  discountAmount?: number;
  commissionAmount?: number;
  totalAmount?: number;
  promoCode?: string;
  /** Frontend-only sample ticket; never grants admission. */
  isDemo?: boolean;
}

export interface TelegramGroupItem {
  id: string;
  title: string;
  description?: string;
  username?: string;
  inviteLink: string;
  memberCount?: number;
}

export interface FunnelSummaryRow {
  name: string;
  count: number;
}

export interface DailyFunnelMetricRow {
  date: string;
  name: string;
  count: number;
}

export interface DailyFunnelSummary {
  fromDate: string;
  throughDate: string;
  rows: DailyFunnelMetricRow[];
}

export interface AnalyticsCountRow {
  name: string;
  count: number;
}

export interface PromotionAnalyticsSummary {
  offerViews: number;
  invoiceStarts: number;
  preCheckout: number;
  cancelledOrClosed: number;
  ticketSellerClicks: number;
  paid: number;
  refunded: number;
}

export interface AnalyticsInsightsSummary {
  fromDate: string;
  throughDate: string;
  daily: DailyFunnelMetricRow[];
  topSearchTerms: AnalyticsCountRow[];
  popularCategories: AnalyticsCountRow[];
  promotionFunnel: PromotionAnalyticsSummary;
}

export interface MeetupCampaignSummaryRow {
  name: 'meetup_share_intent' | 'meetup_invite_open';
  venueId: string;
  campaign: string;
  count: number;
}

export interface MeetupDensityPlan {
  venueId: string;
  venue: string;
  date: string;
  rsvpCount: number;
}

export interface MeetupDensitySummary {
  fromDate: string;
  throughDate: string;
  plans: MeetupDensityPlan[];
}

export interface MeetupVenueOption {
  id: string;
  name: string;
}

export interface OrganizerOrderRow {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  paymentStatus: string;
  paymentMethod: string;
  quantity: number;
  totalAmount: number;
  purchasedAt: string;
}

export interface OrganizerEngagementRow {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  views: number;
  shares: number;
  rsvps: number;
}

export interface AdminEventReport {
  eventId: string;
  eventTitle: string;
  orders: number;
  tickets: number;
  paid: number;
  pending: number;
  revenue: number;
}

export interface OrganizerSubscriptionStatus {
  telegramUserId: number;
  plan: string;
  status: string;
  expiresAt?: string | null;
}

export interface OrganizerSubscriptionOffer {
  available: boolean;
  stars: number;
  durationDays: number;
  features: string[];
}

export interface EventPromotionOffer {
  eligible: boolean;
  available: boolean;
  stars: number;
  expiresAtEventDate: boolean;
  ticketUrl: string;
  campaignId?: string | null;
  status?: string | null;
  expiresAt?: string | null;
}

export interface EventPromotionInvoice {
  campaignId: string;
  stars: number;
  invoiceUrl: string;
}

export interface AdminSalesSummary {
  totalOrders: number;
  totalTickets: number;
  paidOrders: number;
  pendingOrders: number;
  paidRevenue: number;
  requestedRefunds: number;
  activeEvents: number;
}

export interface BotMessageLogRow {
  id: number;
  telegramUserId: number;
  senderName: string;
  username?: string | null;
  messageType: string;
  content: string;
  receivedAt: string;
}
