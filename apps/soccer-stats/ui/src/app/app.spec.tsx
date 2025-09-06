import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should display game setup configuration', () => {
    const { getByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(getByText('Game Setup')).toBeTruthy();
    expect(getByText('Quick Setup with Test Data')).toBeTruthy();
  });
});
