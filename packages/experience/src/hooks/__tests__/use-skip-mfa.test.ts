/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { InteractionEvent } from '@logto/schemas';
import { renderHook } from '@testing-library/react-hooks';
import * as reactRouterDom from 'react-router-dom';

import useSkipMfa from '../use-skip-mfa';

const mockAsyncSkipMfa = jest.fn();
const mockRedirectTo = jest.fn();
const mockHandleError = jest.fn();
const mockErrorHandlers = {};

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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));
const useLocationMock = reactRouterDom.useLocation as jest.Mock;
const useSubmitInteractionErrorHandler = jest.requireMock('../use-submit-interaction-error-handler') as jest.Mock;

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing error handling
    expect(mockHandleError).toBeCalledWith(expect.any(Error), mockErrorHandlers);
  });

  it('handles error with registration flow', async () => {
    useLocationMock.mockReturnValue({ state: { interactionEvent: InteractionEvent.Register } });
    mockAsyncSkipMfa.mockResolvedValue([new Error('fail')]);
    const { result } = renderHook(() => useSkipMfa());

    await result.current();

    expect(useSubmitInteractionErrorHandler).toBeCalledWith(InteractionEvent.Register, { replace: true });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing error handling
    expect(mockHandleError).toBeCalledWith(expect.any(Error), mockErrorHandlers);
  });
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
