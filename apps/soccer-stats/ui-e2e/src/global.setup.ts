import { join } from 'node:path';

import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

setup.describe.configure({
  mode: 'serial',
});

// Configure Playwright with Clerk
setup('global setup', async () => {
  console.log('Running global setup to authenticate user with Clerk...');
  await clerkSetup({
    debug: true,
    dotenv: false,
  });
});

// Define the path to the storage file, which is `user.json`
const authFile = join(__dirname, '../.auth/user.json');

setup('authenticate and save state to storage', async ({ page }) => {
  // Perform authentication steps.
  // This example uses a Clerk helper to authenticate
  await page.goto('/');
  await clerk.signIn({
    page,

    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME || 'test@example.com',
      password: process.env.E2E_CLERK_USER_PASSWORD || 'Password123!',
    },
  });

  // Wait for an element that is only visible when signed in: the
  // dashboard's "My Teams" section.
  await page
    .getByRole('heading', { name: 'My Teams', level: 2 })
    .waitFor({ state: 'visible' });

  await page.context().storageState({ path: authFile });
});
