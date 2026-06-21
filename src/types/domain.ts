export type JourneyType = 'activity' | 'adventure' | 'family' | 'kids' | 'elderly' | 'relax';
export type CompanionType = 'solo' | 'family' | 'kids' | 'friends' | 'elderly';
export type DurationType = 'one-hour' | 'half-day' | 'full-day';
export type CurrentLocation = 'abha' | 'soudah' | 'airport' | 'fog-walk';
export type AgeGroup = 'under-18' | '18-35' | '36-59' | '60-plus' | '18-49' | '50-plus';
export type VisitPurpose = 'activity' | 'family' | 'relax' | 'awareness' | 'urgent';
export type ContentType = 'post' | 'card' | 'pdf';
export type VisitorType = 'visitor' | 'resident';

export interface JourneyAnswers {
  journeyType: JourneyType;
  companion: CompanionType;
  duration: DurationType;
  currentLocation?: CurrentLocation;
  ageGroup?: AgeGroup;
  withFamily?: boolean;
  visitPurpose?: VisitPurpose;
}

export interface HealthEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  audience: string;
  category: string;
  mapUrl: string;
  visits: number;
  active: boolean;
  tone: 'green' | 'blue' | 'rose' | 'amber';
}

export interface HealthCenter {
  id: string;
  name: string;
  distance: string;
  availability: string;
  phone: string;
  mapUrl: string;
}

export interface Walkway {
  id: string;
  name: string;
  distance: string;
  length: string;
  shade: string;
  mapUrl: string;
}

export interface AwarenessContent {
  id: string;
  title: string;
  type: ContentType;
  summary: string;
  category: string;
  actionLabel: string;
  fileUrl: string;
  active: boolean;
  updatedAt: string;
}

export interface KeywordAnswer {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  linkLabel: string;
  linkUrl: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  active: boolean;
  usage: number;
  updatedAt: string;
}

export interface DoctorAssistantQuestion {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  active: boolean;
  order: number;
  updatedAt: string;
}

export interface PassportLevel {
  id: string;
  title: string;
  minPoints: number;
  benefit: string;
}

export interface PassportProfile {
  points: number;
  scans: number;
  achievements: string[];
  badges: string[];
}

export interface QrScan {
  id: string;
  source: string;
  scannedAt: string;
  location: string;
  visits: number;
  lastRoute?: string;
}

export interface QrVisit {
  id: string;
  visitorId: string;
  qrSource: string;
  timestamp: string;
  route: string;
}

export interface AdminMetrics {
  visitors: number;
  qrScans: number;
  journeys: number;
  inquiries: number;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  matchedKeywordId?: string;
}

export interface DailyPlan {
  event: HealthEvent;
  walkway: Walkway;
  healthCenter: HealthCenter;
  tips: string[];
  mapNotes: string[];
}

export interface SmartEntryAgeGroup {
  id: string;
  label: string;
  message: string;
  active: boolean;
}

export interface SmartEntryVisitorType {
  id: VisitorType;
  label: string;
  active: boolean;
}

export interface SmartEntryYesNoQuestion {
  id: 'call937' | 'nearbyFacility' | string;
  question: string;
  yesLabel: string;
  noLabel: string;
  active: boolean;
}

export interface SmartEntryFacilityOption {
  id: string;
  label: string;
  mapUrl: string;
  active: boolean;
}

export interface SmartEntryTripOption {
  id: string;
  label: string;
  active: boolean;
  ageGroupIds: string[];
  title: string;
  healthNotice: string;
  tips: string[];
  ctaLabel: string;
  mapUrl: string;
  route: string;
  call937?: boolean;
}

export interface SmartEntryConfig {
  privacyNote: string;
  ageGroups: SmartEntryAgeGroup[];
  visitorTypes: SmartEntryVisitorType[];
  yesNoQuestions: SmartEntryYesNoQuestion[];
  facilityOptions: SmartEntryFacilityOption[];
  tripOptions: SmartEntryTripOption[];
}
