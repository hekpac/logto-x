import { renderHook } from '@testing-library/react-hooks';

import useSkipMfa from './use-skip-mfa';

const mockAsyncSkipMfa = jest.fn();
const mockHandleError = jest.fn();
const mockRedirectTo = jest.fn();
const mockErrorHandlers = {};

jest.mock('./use-api', () => ({
  __esModule: true,
  default: () => mockAsyncSkipMfa,
}));

jest.mock('./use-error-handler', () => ({
  __esModule: true,
  default: () => mockHandleError,
}));

jest.mock('./use-global-redirect-to', () => ({
  __esModule: true,
  default: () => mockRedirectTo,
}));

jest.mock('./use-submit-interaction-error-handler', () => ({
  __esModule: true,
  default: () => mockErrorHandlers,
}));

describe('useSkipMfa', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects when skipping mfa succeeds', async () => {
    mockAsyncSkipMfa.mockResolvedValue([null, { redirectTo: '/home' }]);
    const { result } = renderHook(() => useSkipMfa());

    await result.current();

    expect(mockRedirectTo).toBeCalledWith('/home');
    expect(mockHandleError).not.toBeCalled();
  });

  it('handles error when skipping mfa fails', async () => {
    const error = new Error('fail');
    mockAsyncSkipMfa.mockResolvedValue([error]);
    const { result } = renderHook(() => useSkipMfa());

    await result.current();

    expect(mockHandleError).toBeCalledWith(error, mockErrorHandlers);
    expect(mockRedirectTo).not.toBeCalled();
  });
});
