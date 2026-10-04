export type EnumValue = number | string;
export type AuthSession = {
  userId: string; email: string; fullName: string; role: string; status: string;
  trustScore: number; hasFoundingMemberBadge: boolean; token: string;
};
export type Match = {
  matchId: string; matchedUserId: string; matchedUserFullName: string;
  faculty: string; department: string; bio: string; trustScore: number;
  hasFoundingMemberBadge: boolean; sharedDeepValues: string[];
  sharedInterests: EnumValue[]; compatibilityScore: number; status: EnumValue;
};
export type Reflection = { quote: string; author: string; thoughtProvokingQuestion: string; interestCategory: string };
export type TodayConnection = { hasMatch: boolean; match: Match | null; reflection: Reflection | null };
export type Vouch = { id: string; voucherId: string; voucherName: string; traits: EnumValue; note: string | null; finalWeight: number; createdAt: string };
export type TrustSummary = { userId: string; trustScore: number; totalVouchesReceived: number; isIncubationComplete: boolean; recentVouches: Vouch[] };
export type Conversation = { id: string; otherUserId: string; otherUserName: string; otherUserPhotoUrl: string | null;
  clarityStage: EnumValue; validMessageCount: number; adaptiveThreshold: number;
  status: EnumValue; isPausedByMe: boolean; lastMessageAt: string };
export type Letter = { id: string; senderId: string; senderName: string; body: string; deliveredAt: string; qualifiesForReveal: boolean; type: EnumValue };
export type Page<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
export type Icebreaker = { text: string; groundingTheme: string; isFromAi: boolean };
export type ConnectionRoute = 'today' | 'character' | 'reflection' | 'waiting' | 'letters' | 'paused' | 'onboarding' | 'profile' | 'vouch';
export const connectionRoutes: ConnectionRoute[] = ['today', 'character', 'reflection', 'waiting', 'letters', 'paused', 'onboarding', 'profile', 'vouch'];
export const interests = [
  { value: 1, label: 'Philosophy' }, { value: 2, label: 'Literature' }, { value: 3, label: 'Architecture' },
  { value: 4, label: 'Music' }, { value: 5, label: 'Academic goals' }, { value: 6, label: 'Science' },
];
export const deepValues = ['Sincerity', 'Respect', 'Empathy', 'Integrity', 'Curiosity', 'Creativity', 'Kindness', 'Responsibility', 'Growth', 'Community', 'Independence', 'Mindfulness'];
export const characterTraits = [
  { value: 1, label: 'Sincere' }, { value: 2, label: 'Respectful' }, { value: 4, label: 'Academically motivated' },
  { value: 8, label: 'Empathetic' }, { value: 16, label: 'Reliable' }, { value: 32, label: 'Creative' },
];
export const hasStatus = (value: EnumValue, number: number, name: string) => value === number || value === name;
export function interestLabel(value: EnumValue) {
  return interests.find(i => i.value === value || i.label.replaceAll(' ', '') === value)?.label ?? String(value);
}
export function traitLabels(value: EnumValue): string[] {
  return typeof value === 'number' ? characterTraits.filter(t => (value & t.value) !== 0).map(t => t.label)
    : value.split(',').map(t => t.trim()).filter(t => t !== 'None');
}
