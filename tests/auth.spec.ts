import { expect, test } from '@playwright/test';

test('sign-in errors focus the summary and link to each invalid field', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('University email')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('link', { name: 'Enter a valid email address.' }).click();
  await expect(page.getByLabel('University email')).toBeFocused();
  await page.getByLabel('University email').fill('anjali@students.sab.ac.lk');
  await page.getByLabel('Password', { exact: true }).fill('Example123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('when the service is connected');
});

test('password reveal preserves the value and never submits the form', async ({ page }) => {
  await page.goto('/');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('Example123');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('Example123');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('signup validates the password and retains account details across campus steps', async ({ page }) => {
  await page.goto('/#sign-up');
  await page.getByLabel('Full name').fill('Anjali Senanayake');
  await page.getByLabel('University email').fill('anjali@gmail.com');
  await page.getByLabel('Create password').fill('Example123');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('approved university email');
  await page.getByLabel('University email').fill('anjali@students.sab.ac.lk');
  await page.getByLabel('Create password').fill('short');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('uppercase, lowercase and a number');
  await page.getByLabel('Create password').fill('Example123');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Find your circle.' })).toBeVisible();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByLabel('Faculty', { exact: true }).selectOption('Applied Sciences');
  await page.getByLabel('Department', { exact: true }).selectOption('Computing and Information Systems');
  await page.getByLabel('Academic year', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Have an ambassador invitation?' }).click();
  await page.getByRole('button', { name: 'Create account with invitation' }).click();
  await expect(page.getByRole('alert')).toContainText('invitation code');
  await page.getByLabel('Ambassador invitation', { exact: true }).fill('REVIEW-CODE');
  await page.getByRole('button', { name: 'Create account with invitation' }).click();
  await expect(page.getByRole('status')).toContainText('Account creation will be available');
  await page.getByRole('button', { name: 'Back to account details' }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Anjali Senanayake');
  await expect(page.getByLabel('Create password')).toHaveValue('Example123');
});

test('signup cannot be submitted without account details after a direct campus visit', async ({ page }) => {
  await page.goto('/#campus');
  await page.getByLabel('Faculty', { exact: true }).selectOption('Applied Sciences');
  await page.getByLabel('Department', { exact: true }).selectOption('Physical Sciences');
  await page.getByLabel('Academic year', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Begin with you.' })).toBeVisible();
  await expect(page.getByRole('alert')).toBeFocused();
});

test('authentication layouts fit desktop and mobile without horizontal overflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  for (const width of [1440, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width > 767 ? 1040 : 844 });
    for (const route of ['sign-in', 'sign-up', 'campus', 'invitation']) {
      await page.goto(`/#${route}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (width === 1440 || width === 390) {
        await page.screenshot({ path: `test-results/${route}-${width}.png`, fullPage: true });
      }
    }
  }
  expect(consoleErrors).toEqual([]);
});
