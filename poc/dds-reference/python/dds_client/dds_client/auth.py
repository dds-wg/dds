"""Authentication helpers. Mirrors `packages/client-ts/src/auth/*.ts`.

For first-iteration POCs we expose a simple app-password helper. The TypeScript
library has OAuth helpers because it targets browsers, where OAuth is the canonical
choice; the Python library is primarily used by the clustering server, where a
service identity with an app password is simpler and equally adequate.

If OAuth is needed later, the atproto Python SDK provides `OAuthClient` we can wrap
the same way `auth/node.ts` wraps `@atproto/oauth-client-node`.
"""

from __future__ import annotations

from atproto import Client

from .agent import DDSClient


def login_with_app_password(
    *,
    identifier: str,
    password: str,
    service: str = "https://bsky.social",
) -> DDSClient:
    """Authenticate via Bluesky app password and return a ready DDSClient.

    `identifier` may be a handle (`alice.bsky.social`) or DID. `password` must be an
    app password generated from the Bluesky settings, not the account password.
    """
    client = Client(base_url=service)
    client.login(identifier, password)
    return DDSClient(client)
