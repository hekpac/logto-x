# @logto/shared

The shared package for **non-business** components. For Logto business related stuff, put it to one of the packages in `packages/toolkit/`.

The main import includes all components which may require Node. Import `@logto/shared/universal` for the universal bundle.

## Environment variables

`GSI_CORP_SUPPORTED`

: Toggle support for the Google One Tap CORP header. Defaults to `true`. Set to a falsy value to disable the `Cross-Origin-Embedder-Policy` header until Google officially documents CORP support.
