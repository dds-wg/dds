ExperimentC:did:key as originating DID
```
```
poc % pnpm exec tsx C-didkey-originated.tsx
[Experiment C] Testing did:key natively against AT Protocol

-> 1. Trying describeRepo with did:key...
  [Rejected] Error: InvalidRequest
  [Message] Could not find user: did:key:z6MkhaXgBZDvotDkL5257faiztiuC2Q3hA4Kpm8o1eM3QGwk

-> 2. Trying createRecord with did:key...
  [Rejected] Error: InternalServerError
  [Message] Unable to fulfill XRPC request

==================================================
[Experiment C-2] Trying to CREATE AN ACCOUNT with did:key...
==================================================

  ❌ [Rejected] Error: InternalServerError
  ❌ [Message] Unable to fulfill XRPC request
```
```
