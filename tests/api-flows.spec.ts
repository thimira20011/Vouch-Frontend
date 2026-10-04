import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const user = { userId: 'a1111111-1111-4111-8111-111111111111', email: 'thimira@students.sab.ac.lk', fullName: 'Thimira Niranjaya', role: 'Seeker', status: 'Active', trustScore: 4, hasFoundingMemberBadge: false, token: 'test-token' };
const match = { matchId: 'match-id', matchedUserId: 'other-user', matchedUserFullName: 'Anjali Senanayake', faculty: 'Applied Sciences', department: 'Computing', bio: 'A thoughtful introduction.', trustScore: 4, hasFoundingMemberBadge: false, sharedDeepValues: ['Curiosity'], sharedInterests: [4], compatibilityScore: 0, status: 1 };
const trust = { userId: user.userId, trustScore: 4, totalVouchesReceived: 4, isIncubationComplete: true, recentVouches: [] };
const conversation = { id: 'conversation-id', otherUserId: 'other-user', otherUserName: 'Maya', otherUserPhotoUrl: null, clarityStage: 0, validMessageCount: 2, adaptiveThreshold: 40, status: 1, isPausedByMe: false, lastMessageAt: new Date().toISOString() };
const envelope = <T>(items: T[]) => ({ items, page: 1, pageSize: 50, totalCount: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });

async function login(page: Page) {
  await page.goto('http://127.0.0.1:5176/#sign-in');
  await page.getByLabel('University email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Example123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little less noise. A little more connection.' })).toBeVisible();
}

test('live mode preserves failed letter drafts and verifies persisted match status', async ({ page }) => {
  let failSend = true;
  let sends = 0;
  await page.route('http://127.0.0.1:5000/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { 'access-control-allow-origin': 'http://127.0.0.1:5176', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    let body: unknown = {};
    let status = 200;
    if (path.endsWith('/login')) body = user;
    else {
      expect(request.headers().authorization).toBe('Bearer test-token');
      if (path.endsWith('/today')) body = { hasMatch: true, match, reflection: null };
      else if (path.includes('/vouches/')) body = trust;
      else if (path.endsWith('/respond')) body = { isMutualMatch: true, accepted: true };
      else if (path.endsWith('/messages') && request.method() === 'POST') {
        sends += 1;
        if (failSend) { status = 503; body = { error: 'Letters are unavailable for a moment. Please try again.' }; }
        else body = { id: 'sent-letter', senderId: user.userId, senderName: user.fullName, body: request.postDataJSON().body, deliveredAt: new Date().toISOString(), qualifiesForReveal: true, type: 1 };
      } else if (path.endsWith('/messages')) body = envelope([]);
      else if (path.includes('/icebreakers/')) body = [{ text: 'What song holds a memory for you?', groundingTheme: 'Music', isFromAi: false }];
      else if (path.endsWith('/conversations/')) body = envelope([conversation]);
    }
    await route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await login(page);
  await page.getByRole('link', { name: 'View character card' }).click();
  await page.getByRole('button', { name: 'Accept introduction' }).click();
  await expect(page.getByText('Waiting for Anjali to accept, too.')).toBeVisible();
  await page.getByRole('link', { name: 'Read existing letters' }).click();
  await expect(page.getByRole('heading', { name: 'Letters with Maya' })).toBeVisible();
  await page.getByLabel('YOUR LETTER', { exact: true }).fill('This draft must survive a failed send.');
  await page.getByRole('button', { name: 'Send letter', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Letters are unavailable');
  await expect(page.getByLabel('YOUR LETTER', { exact: true })).toHaveValue('This draft must survive a failed send.');
  failSend = false;
  await page.getByRole('button', { name: 'Send letter', exact: true }).click();
  await expect(page.getByText('This draft must survive a failed send.', { exact: true })).toHaveCount(1);
  await expect(page.getByLabel('YOUR LETTER', { exact: true })).toHaveValue('');
  expect(sends).toBe(2);
});

test('a rejected login preserves credentials and focuses server feedback', async ({ page }) => {
  await page.route('http://127.0.0.1:5000/api/auth/login', route => route.fulfill({ status: 401, headers: { 'access-control-allow-origin': 'http://127.0.0.1:5176' }, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid email or password.' }) }));
  await page.goto('http://127.0.0.1:5176/#sign-in');
  await page.getByLabel('University email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Example123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('Example123');
});

test('registration and onboarding send the backend payload and show incubation', async ({ page }) => {
  let registration: Record<string, unknown> | null = null;
  let onboarding: Record<string, unknown> | null = null;
  await page.route('http://127.0.0.1:5000/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { 'access-control-allow-origin': 'http://127.0.0.1:5176', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    let body: unknown = {};
    if (path.endsWith('/register')) { registration = request.postDataJSON(); body = { ...user, status: 'InIncubation', trustScore: 0 }; }
    else if (path.endsWith('/onboarding')) { expect(request.headers().authorization).toBe('Bearer test-token'); onboarding = request.postDataJSON(); body = { message: 'Onboarding completed successfully.' }; }
    else if (path.endsWith('/today')) body = { hasMatch: false, match: null, reflection: { quote: '', author: '', thoughtProvokingQuestion: 'What brought you peace today?', interestCategory: 'Music' } };
    else if (path.includes('/vouches/')) body = { ...trust, trustScore: 0, totalVouchesReceived: 0, isIncubationComplete: false };
    await route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('http://127.0.0.1:5176/#sign-up');
  await page.getByLabel('Full name').fill(user.fullName);
  await page.getByLabel('University email').fill(user.email);
  await page.getByLabel('Create password').fill('Example123');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Faculty', { exact: true }).selectOption('Applied Sciences');
  await page.getByLabel('Department', { exact: true }).selectOption('Computing and Information Systems');
  await page.getByLabel('Academic year', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Begin with what matters to you.' })).toBeVisible();
  expect(registration).toMatchObject({ FullName: user.fullName, Email: user.email, Password: 'Example123', AcademicYear: 3, CampusCode: 'SAB', InviteToken: null });
  await page.getByRole('checkbox', { name: 'Curiosity', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Music', exact: true }).check();
  await page.getByLabel('A little about you').fill('A short bio.');
  await page.getByRole('button', { name: 'Save and find your circle' }).click();
  await expect(page.getByRole('heading', { name: 'Good things begin with trust.' })).toBeVisible();
  expect(onboarding).toEqual({ bio: 'A short bio.', deepValues: ['Curiosity'], intellectualInterests: [4] });
  await expect(page.getByRole('heading', { name: '0 of 3 peer vouches' })).toBeVisible();
});

test('configured protected routes require signing in and do not silently display sample data', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.url().includes('/api/')) requests += 1; });
  await page.goto('http://127.0.0.1:5176/#letters');
  await expect(page.getByText('Sign in to see your introductions and letters.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Letters with Maya' })).toHaveCount(0);
  expect(requests).toBe(0);
});
