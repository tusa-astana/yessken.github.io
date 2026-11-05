export interface InterestGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  isMember: boolean;
  gatherings: InterestGathering[];
}

export interface InterestGathering {
  id: string;
  interestId: string;
  hostTelegramUserId: number;
  title: string;
  date: string;
  time: string;
  place: string;
  details: string;
  goingCount: number;
  userGoing: boolean;
  isHost: boolean;
}

export interface InterestMember {
  telegramUserId: number | null;
  name: string;
  photoUrl: string | null;
  username: string | null;
  anonymous: boolean;
  openToMeet: boolean;
  isYou: boolean;
}

export type InterestReportReason = 'spam' | 'harassment' | 'impersonation' | 'unsafe' | 'other';

export interface InterestReport {
  id: string;
  interestId: string;
  interestName: string;
  reason: InterestReportReason;
  details: string;
  createdAt: string;
  reporterTelegramUserId: number;
  reporterName: string;
  reporterUsername: string | null;
  targetTelegramUserId: number;
  targetName: string;
  targetUsername: string | null;
  targetSuspended: boolean;
}
