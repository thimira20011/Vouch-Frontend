import { expect, test } from '@playwright/test';

test('an introduction can be accepted and waits for mutual acceptance', async ({ page }) => {
  await page.goto('/?preview=1#today');
  await page.getByRole('link', { name: 'View character card', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anjali Senanayake', level: 1 })).toBeFocused();
  await page.getByRole('button', { name: 'Accept introduction', exact: true }).click();
  await expect(page.getByText('Waiting for Anjali to accept, too.')).toBeVisible();
  await page.getByRole('link', { name: 'Back to today', exact: true }).click();
  await expect(page.getByRole('link', { name: 'View accepted introduction' })).toBeVisible();
  await page.getByRole('link', { name: 'View accepted introduction' }).click();
  await expect(page.getByRole('button', { name: 'Accept introduction' })).toHaveCount(0);
});

test('passing on mobile leads to a reflection without offering the introduction again', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?preview=1#today');
  await page.getByRole('button', { name: 'Pass for today' }).click();
  await expect(page.getByRole('heading', { name: 'Some days are for looking inward.' })).toBeVisible();
  await page.getByRole('link', { name: 'Return to today' }).click();
  await expect(page.getByRole('link', { name: 'View character card' })).toHaveCount(0);
});

test('letters require text, send once, pause without losing the draft, and resume', async ({ page }) => {
  await page.goto('/?preview=1#letters');
  await expect(page.getByRole('button', { name: 'Send letter' })).toBeDisabled();
  await page.getByLabel('YOUR LETTER', { exact: true }).fill('  ');
  await expect(page.getByRole('button', { name: 'Send letter' })).toBeDisabled();
  await page.getByLabel('YOUR LETTER', { exact: true }).fill('A thoughtful letter from the test.');
  await page.getByRole('button', { name: 'Send letter' }).click();
  await expect(page.getByText('A thoughtful letter from the test.', { exact: true })).toHaveCount(1);
  await expect(page.getByLabel('YOUR LETTER', { exact: true })).toHaveValue('');
  await page.getByLabel('YOUR LETTER', { exact: true }).fill('A draft I want to keep.');
  await page.getByRole('button', { name: 'Pause conversation' }).click();
  await expect(page.getByLabel('YOUR LETTER', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume conversation' }).click();
  await expect(page.getByLabel('YOUR LETTER', { exact: true })).toHaveValue('A draft I want to keep.');
  await page.getByRole('link', { name: 'Today', exact: true }).first().click();
  await page.getByRole('link', { name: 'Letters', exact: true }).first().click();
  await expect(page.getByLabel('YOUR LETTER', { exact: true })).toHaveValue('A draft I want to keep.');
});

test('onboarding limits selections and focuses linked validation feedback', async ({ page }) => {
  await page.goto('/?preview=1#onboarding');
  await page.getByRole('button', { name: 'Save and find your circle' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByRole('link', { name: 'Choose between one and five values.' }).click();
  await expect(page.getByRole('group', { name: 'Your values' })).toBeFocused();
  for (const value of ['Sincerity', 'Respect', 'Empathy', 'Integrity', 'Curiosity']) await page.getByRole('checkbox', { name: value, exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Creativity', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Music', exact: true }).check();
  await page.getByRole('button', { name: 'Save and find your circle' }).click();
  await expect(page.getByRole('heading', { name: 'A little less noise. A little more connection.' })).toBeVisible();
});

test('safety dialog traps keyboard focus, returns focus, and validates the report', async ({ page }) => {
  await page.goto('/?preview=1#character');
  const trigger = page.getByRole('button', { name: 'Report or block this profile' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab');
    expect(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
  }
  await page.getByRole('button', { name: 'Submit report' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByLabel('Tell us a little more').fill('This is a sample concern for the design preview.');
  await page.getByRole('button', { name: 'Submit report' }).click();
  await expect(page.getByText('Your report has been recorded in this preview.')).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('all new screens fit phone, tablet, desktop and landscape with reduced motion', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[1440, 1040], [768, 1024], [390, 844], [375, 667], [844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const route of ['today', 'character', 'waiting', 'reflection', 'letters', 'paused', 'onboarding', 'profile', 'vouch']) {
      await page.goto(`/?preview=1#${route}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.locator('.reading-viewport').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      if ((width === 1440 || width === 390) && !['onboarding', 'profile', 'vouch'].includes(route)) await page.screenshot({ path: `test-results/${route}-${width}.png` });
      if (width === 390) {
        await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
        const nav = await page.getByRole('navigation', { name: 'Mobile navigation' }).boundingBox();
        const viewport = await page.locator('.reading-viewport').boundingBox();
        expect(viewport!.y + viewport!.height).toBeLessThanOrEqual(nav!.y + 1);
      }
    }
  }
  expect(errors).toEqual([]);
});
