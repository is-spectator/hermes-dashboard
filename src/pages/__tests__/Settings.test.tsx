import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '@/pages/Settings';
import { renderWithProviders } from '@/test/utils';
import { useAppStore } from '@/stores/useAppStore';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function htmlResponse(): Response {
  return new Response('<html><body>nope</body></html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
}

const STATUS_OK = {
  version: '0.9.0',
  release_date: '2026.4.13',
  hermes_home: '/x',
  config_path: '/x/config.yaml',
  env_path: '/x/.env',
  config_version: 17,
  latest_config_version: 17,
  gateway_running: false,
  gateway_pid: null,
  gateway_state: null,
  gateway_platforms: {},
  gateway_exit_reason: null,
  gateway_updated_at: null,
  active_sessions: 0,
};

describe('SettingsPage — Connection section', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.__HERMES_SESSION_TOKEN__ = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Save & Test updates baseUrl in the store and triggers GET /api/status', async () => {
    // First useStatus autorun.
    fetchMock.mockResolvedValue(jsonResponse(STATUS_OK));
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const input = (await screen.findByLabelText(
      'Hermes API URL',
    )) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, 'http://new-host:9000');

    await user.click(screen.getByRole('button', { name: 'Save & Test' }));

    await waitFor(() => {
      expect(useAppStore.getState().baseUrl).toBe('http://new-host:9000');
    });

    // getStatus was invoked.
    const statusCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('/api/status'),
    );
    expect(statusCalls.length).toBeGreaterThan(0);
  });

  it('SPA fallback (HTML response) flips connection status to offline with an error message', async () => {
    fetchMock.mockResolvedValue(htmlResponse());

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      // Default EN label for offline variant is "Offline".
      expect(screen.queryByText('Offline')).toBeInTheDocument();
    });

    // StatusDot role=status should announce the state.
    const offlineNodes = screen.getAllByText('Offline');
    expect(offlineNodes.length).toBeGreaterThan(0);
  });

  it('401 Unauthorized surfaces a session-token input for manual override', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );

    renderWithProviders(<SettingsPage />);

    // Status dot renders "Offline" when useStatus errors.
    await waitFor(() => screen.getByText('Offline'));

    const tokenField = await screen.findByLabelText('Session token');
    expect(tokenField).toBeInTheDocument();
    // The error message should include "Unauthorized".
    expect(
      screen.getAllByText(/Unauthorized/i).length,
    ).toBeGreaterThan(0);
  });

  it('Reset to default restores the hard-coded localhost URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(STATUS_OK));
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />, {
      initialAppState: { baseUrl: 'http://custom:9999' },
    });

    await user.click(screen.getByRole('button', { name: 'Reset to default' }));

    await waitFor(() => {
      expect(useAppStore.getState().baseUrl).toBe('http://127.0.0.1:9119');
    });
  });

  it('language select switches the store lang immediately', async () => {
    fetchMock.mockResolvedValue(jsonResponse(STATUS_OK));
    renderWithProviders(<SettingsPage />);

    const select = (await screen.findByLabelText('Language')) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'zh' } });

    expect(useAppStore.getState().lang).toBe('zh');
  });
});
