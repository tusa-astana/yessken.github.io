export interface InterestGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  isMember: boolean;
  notifyNewGatherings: boolean;
  communities?: InterestCommunity[];
  gatherings: InterestGathering[];
}

export interface InterestCommunity {
  id: string;
  title: string;
  description: string;
  platform: 'telegram' | 'reddit';
  url: string;
}

export interface InterestCommunityReview {
  id: string;
  title: string;
  description: string;
  platform: 'telegram' | 'reddit';
  url: string;
  createdAt: string;
  interests: string[];
}

export interface InterestGathering {
  id: string;
  interestId: string;
  title: string;
  date: string;
  time: string;
  place: string;
  details: string;
  goingCount: number;
  userGoing: boolean;
  isHost: boolean;
  isOpen: boolean;
  isNew: boolean;
}

export interface InterestGatheringPreview {
  id: string;
  interestId: string;
  interestName: string;
  interestEmoji: string;
  title: string;
  date: string;
  time: string;
  place: string;
  details: string;
  goingCount: number;
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
