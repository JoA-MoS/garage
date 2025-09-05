import type { Preview } from '@storybook/react';
import { BrowserRouter } from 'react-router';
import { ClerkProvider } from '@clerk/clerk-react';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Mock Clerk publishable key for Storybook
      const PUBLISHABLE_KEY = 'pk_test_mock_key_for_storybook';

      return (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <BrowserRouter>
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          </BrowserRouter>
        </ClerkProvider>
      );
    },
  ],
};

export default preview;
