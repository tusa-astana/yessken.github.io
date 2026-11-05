export type MeetupDay = 'today' | 'tomorrow' | 'weekend';
export type VenueType = 'bar' | 'club' | 'lounge';

export interface MeetupAttendee {
  id: string;
  name: string;
  username?: string | null;
  photoUrl?: string | null;
  time: string;
  anonymous: boolean;
  openToMeet: boolean;
  isYou: boolean;
}

export interface MeetupPlan {
  id: string;
  venue: string;
  type: VenueType;
  address: string;
  lat: number | null;
  lng: number | null;
  openingHours?: string | null;
  website?: string | null;
  mapUrl: string;
  featured: boolean;
  promotionLabel?: string | null;
  imageUrl?: string | null;
  galleryUrl?: string | null;
  previewPostUrl?: string | null;
  date: string;
  goingCount: number;
  openToMeetCount: number;
  userGoing: boolean;
  attendees: MeetupAttendee[];
}

export interface MeetupCatalogResponse {
  date: string;
  sourceUpdatedAtUtc: string;
  dataSource: string;
  venues: MeetupPlan[];
}

export interface MeetupSelection {
  date: string;
  anonymous: boolean;
  openToMeet: boolean;
  time: string;
}
