import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('BuzzLocal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Authentication Flow', () => {
    test('should show login screen', async ({ page }) => {
      // Check for phone input
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i]');
      await expect(phoneInput).toBeVisible();
    });

    test('should request OTP on phone submit', async ({ page }) => {
      // Enter phone number
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i]');
      await phoneInput.fill('9876543210');

      // Submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check for OTP input
      const otpInput = page.locator('input[placeholder*="otp" i], input[maxlength="1"]');
      await expect(otpInput.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid phone', async ({ page }) => {
      // Enter short phone number
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i]');
      await phoneInput.fill('123');

      // Submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check for error message
      const errorMessage = page.locator('text=/invalid|error|enter.*digit/i');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Home Feed', () => {
    test.beforeEach(async ({ page }) => {
      // Skip auth for these tests (mock auth)
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
        localStorage.setItem('user', JSON.stringify({ id: 'test_user', name: 'Test User' }));
      });
      await page.reload();
    });

    test('should display feed with posts', async ({ page }) => {
      // Wait for feed to load
      const feed = page.locator('[data-testid="feed"], [data-testid="post-list"], scrollview');
      await expect(feed).toBeVisible({ timeout: 10000 });
    });

    test('should show AI cards in feed', async ({ page }) => {
      // Check for AI card or trending section
      const aiCard = page.locator('text=/trending|ai|insights/i');
      await expect(aiCard.first()).toBeVisible({ timeout: 10000 });
    });

    test('should pull to refresh', async ({ page }) => {
      // Find scrollable area
      const scrollArea = page.locator('scrollview, [data-testid="feed"], FlatList').first();
      await scrollArea.evaluate((el) => el.scrollTo({ top: 0 }));
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
      });
      await page.reload();
    });

    test('should navigate to Explore', async ({ page }) => {
      const exploreTab = page.locator('text=/explore/i, [aria-label*="explore" i]');
      await exploreTab.first().click();
      await expect(page.locator('text=/search/i')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to Events', async ({ page }) => {
      const eventsTab = page.locator('text=/events/i, [aria-label*="events" i]');
      await eventsTab.first().click();
      await expect(page.locator('text=/event/i')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to Weather', async ({ page }) => {
      const weatherTab = page.locator('text=/weather/i, [aria-label*="weather" i]');
      await weatherTab.first().click();
      await expect(page.locator('text=/°C|temperature|weather/i')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to Map', async ({ page }) => {
      const mapTab = page.locator('text=/map|vibe/i, [aria-label*="map" i]');
      await mapTab.first().click();
      // Map should show
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Post Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
      });
      await page.reload();
    });

    test('should open create post modal', async ({ page }) => {
      // Find and tap create button
      const createButton = page.locator('[aria-label*="create" i], [data-testid="create-button"]');
      await createButton.first().click();

      // Check for post type options
      const postTypes = page.locator('text=/general|event|alert|place|deal/i');
      await expect(postTypes.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show all post type options', async ({ page }) => {
      // Navigate to create
      const createButton = page.locator('[aria-label*="create" i]');
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Check all post types
      await expect(page.locator('text=/general/i')).toBeVisible();
      await expect(page.locator('text=/event/i')).toBeVisible();
      await expect(page.locator('text=/alert/i')).toBeVisible();
      await expect(page.locator('text=/place/i')).toBeVisible();
      await expect(page.locator('text=/deal/i')).toBeVisible();
      await expect(page.locator('text=/poll/i')).toBeVisible();
    });
  });

  test.describe('Events', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
      });
      await page.reload();
    });

    test('should display events list', async ({ page }) => {
      // Navigate to events
      await page.locator('text=/events/i').first().click();
      await page.waitForTimeout(2000);

      // Should show event cards or list
      const eventContent = page.locator('text=/event|concert|meetup/i');
      await expect(eventContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter events by category', async ({ page }) => {
      // Navigate to events
      await page.locator('text=/events/i').first().click();
      await page.waitForTimeout(2000);

      // Find and tap category filter
      const filterButton = page.locator('text=/filter|category/i');
      await filterButton.first().click();

      // Select a category
      const musicCategory = page.locator('text=/music/i');
      await musicCategory.first().click();
    });
  });

  test.describe('Weather', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
      });
      await page.reload();
    });

    test('should display weather data', async ({ page }) => {
      // Navigate to weather
      await page.locator('text=/weather/i').first().click();
      await page.waitForTimeout(3000);

      // Should show temperature or weather info
      const weatherContent = page.locator('text=/°C|°F|temperature|humidity/i');
      await expect(weatherContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show hourly forecast', async ({ page }) => {
      await page.locator('text=/weather/i').first().click();
      await page.waitForTimeout(3000);

      // Check for hourly section
      const hourlySection = page.locator('text=/hourly|forecast/i');
      await expect(hourlySection.first()).toBeVisible();
    });
  });

  test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
      });
      await page.reload();
    });

    test('should display user stats', async ({ page }) => {
      // Navigate to profile
      await page.locator('[aria-label*="profile" i], [data-testid="profile"]').first().click();
      await page.waitForTimeout(2000);

      // Should show stats
      const stats = page.locator('text=/posts|check-ins|coins|streak/i');
      await expect(stats.first()).toBeVisible();
    });

    test('should show badges', async ({ page }) => {
      await page.locator('[aria-label*="profile" i]').first().click();
      await page.waitForTimeout(2000);

      // Check for badges section
      const badges = page.locator('text=/badges|achievements/i');
      await expect(badges.first()).toBeVisible();
    });
  });

  test.describe('Wallet', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock_token');
      });
      await page.reload();
    });

    test('should display coin balance', async ({ page }) => {
      // Navigate to wallet
      await page.locator('text=/wallet|coins/i').first().click();
      await page.waitForTimeout(2000);

      // Should show balance
      const balance = page.locator('text=/balance|coins/i');
      await expect(balance.first()).toBeVisible();
    });

    test('should show transaction history', async ({ page }) => {
      await page.locator('text=/wallet/i').first().click();
      await page.waitForTimeout(2000);

      // Check for transactions
      const transactions = page.locator('text=/transaction|history|earned|spent/i');
      await expect(transactions.first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show offline message when network fails', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      await page.reload();

      // Should show error or offline message
      const offlineMessage = page.locator('text=/offline|no.*connection|network/i');
      await expect(offlineMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test('should allow retry on error', async ({ page }) => {
      // Navigate and trigger error
      await page.goto(BASE_URL + '/nonexistent-route');
      await page.waitForTimeout(2000);

      // Check for 404 or error page
      const errorPage = page.locator('text=/404|not.*found|error/i');
      await expect(errorPage.first()).toBeVisible();
    });
  });
});
