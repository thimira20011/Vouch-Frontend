import type { AuthSession, Conversation, Icebreaker, Letter, Match, Reflection, TrustSummary } from './types';

export const previewSession: AuthSession = {
  userId: 'preview-you', email: 'thimira@students.sab.ac.lk', fullName: 'Thimira Niranjaya',
  role: 'Seeker', status: 'Active', trustScore: 4, hasFoundingMemberBadge: false, token: '',
};
export const previewMatch: Match = {
  matchId: 'preview-match', matchedUserId: 'preview-anjali', matchedUserFullName: 'Anjali Senanayake',
  faculty: 'Applied Sciences', department: 'Computing and Information Systems',
  bio: 'Usually somewhere between a good book, a long walk, and a song I want to share.', trustScore: 4,
  hasFoundingMemberBadge: false, sharedDeepValues: ['Curiosity', 'Empathy'], sharedInterests: [4, 6], compatibilityScore: 0, status: 1,
};
export const previewReflection: Reflection = { quote: '', author: '', thoughtProvokingQuestion: 'What is a small thing someone did that made you feel understood?', interestCategory: 'philosophy' };
export const previewTrust: TrustSummary = {
  userId: 'preview-anjali', trustScore: 4, totalVouchesReceived: 4, isIncubationComplete: true,
  recentVouches: [
    { id: 'preview-vouch-1', voucherId: 'preview-kavindi', voucherName: 'Kavindi', traits: 17, note: 'She shows up when it matters and makes people feel heard.', finalWeight: 1, createdAt: '2026-10-01T00:00:00Z' },
    { id: 'preview-vouch-2', voucherId: 'preview-dinuka', voucherName: 'Dinuka', traits: 32, note: 'Thoughtful, quietly creative, and always curious.', finalWeight: 1, createdAt: '2026-10-01T00:00:00Z' },
  ],
};
export const previewConversation: Conversation = { id: 'preview-maya', otherUserId: 'preview-maya-user', otherUserName: 'Maya', otherUserPhotoUrl: null, clarityStage: 0, validMessageCount: 2, adaptiveThreshold: 40, status: 1, isPausedByMe: false, lastMessageAt: '2026-10-04T03:45:00Z' };
export const previewLetters: Letter[] = [
  { id: 'preview-letter-1', senderId: 'preview-maya-user', senderName: 'Maya', body: 'I love the idea that a song can hold a whole memory. Is there one that takes you somewhere every time you hear it?', deliveredAt: '2026-10-03T13:12:00Z', qualifiesForReveal: true, type: 1 },
  { id: 'preview-letter-2', senderId: 'preview-you', senderName: 'Thimira Niranjaya', body: 'There is a song my father used to play on Sunday mornings. Hearing it still feels like the windows are open and there is nowhere to hurry.', deliveredAt: '2026-10-04T03:45:00Z', qualifiesForReveal: true, type: 1 },
];
export const previewIcebreaker: Icebreaker = { text: 'Which book changed how you see someone else’s life?', groundingTheme: 'Music and literature', isFromAi: false };
