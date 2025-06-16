/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { InteractionEvent } from '@logto/schemas';
import { renderHook } from '@testing-library/react-hooks';
import * as reactRouterDom from 'react-router-dom';

import useSkipMfa from '../use-skip-mfa';

const mockAsyncSkipMfa = jest.fn();
const mockRedirectTo = jest.fn();
const mockHandleError = jest.fn();
const mockErrorHandlers = {};
const mockMfaHandlers = { 'user.missing_mfa': jest.fn() };

jest.mock('../use-api', () => ({
  __esModule: true,
  default: () => mockAsyncSkipMfa,
}));

jest.mock('../use-global-redirect-to', () => ({
  __esModule: true,
  default: () => mockRedirectTo,
}));

jest.mock('../use-error-handler', () => ({
  __esModule: true,
  default: () => mockHandleError,
}));

jest.mock('../use-submit-interaction-error-handler', () => ({
  __esModule: true,
  default: jest.fn(() => mockErrorHandlers),
}));

jest.mock('../use-mfa-error-handler', () => ({
  __esModule: true,
  default: jest.fn(() => mockMfaHandlers),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));
const useLocationMock = reactRouterDom.useLocation as jest.Mock;
const useSubmitInteractionErrorHandler = jest.requireMock('../use-submit-interaction-error-handler') as jest.Mock;
const useMfaErrorHandler = jest.requireMock('../use-mfa-error-handler') as jest.Mock;

describe('useSkipMfa', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects when skipping mfa succeeds', async () => {
    useLocationMock.mockReturnValue({});
    mockAsyncSkipMfa.mockResolvedValue([null, { redirectTo: '/home' }]);
    const { result } = renderHook(() => useSkipMfa());

    await result.current();

    expect(mockRedirectTo).toBeCalledWith('/home');
    expect(mockHandleError).not.toBeCalled();
  });

  it('handles error with sign-in flow', async () => {
    useLocationMock.mockReturnValue({});
    mockAsyncSkipMfa.mockResolvedValue([new Error('fail')]);
    const { result } = renderHook(() => useSkipMfa());

    await result.current();

    expect(useSubmitInteractionErrorHandler).toBeCalledWith(InteractionEvent.SignIn, { replace: true });
    expect(useMfaErrorHandler).toBeCalledWith({ replace: true });
    expect(mockHandleError).toBeCalledWith(
      expect.any(Error),
      expect.objectContaining({
        'session.mfa.mfa_policy_not_user_controlled': mockMfaHandlers['user.missing_mfa'],
      })
    );
  });

  it('handles error with registration flow', async () => {
    useLocationMock.mockReturnValue({ state: { interactionEvent: InteractionEvent.Register } });
    mockAsyncSkipMfa.mockResolvedValue([new Error('fail')]);
    const { result } = renderHook(() => useSkipMfa());

    await result.current();

    expect(useSubmitInteractionErrorHandler).toBeCalledWith(InteractionEvent.Register, { replace: true });
    expect(useMfaErrorHandler).toBeCalledWith({ replace: true });
    expect(mockHandleError).toBeCalledWith(
      expect.any(Error),
      expect.objectContaining({
        'session.mfa.mfa_policy_not_user_controlled': mockMfaHandlers['user.missing_mfa'],
      })
    );
  });
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
