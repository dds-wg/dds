# Technical Specification: MynaWallet-Backed Bluesky Account Issuance (PoC)

**Version:** 0.4 (Draft)
**Last updated:** 2026-08-10
**Status:** Pre-review draft

> **Changes from v0.3**
>
> 1. **The WalletConnect layer is now specified (§7).** Official help pages confirm MynaWallet supports WalletConnect — but note it is delivered as a **WalletConnect mini-app on the home tab**, not as a settings item.
> 2. **Assurance level names changed.** L0/L1/L2 read too much like blockchain layers; they are now `none` / `wallet-control` / `identity-verified`.
> 3. **A UX flow section was added (§8)**, with step counts, perceived duration, and drop-off points.
> 4. **ERC-6492 was demoted.** MynaWallet accounts are likely already deployed at identity-proofing time, so the undeployed path becomes an exception.
> 5. **G0 is now concrete.** "Does WalletConnect work" is settled, so the gate narrows to **confirming signature formats**.

---

## 1. Purpose

Issue impersonation-resistant Bluesky accounts. Identity proofing is delegated to an external issuer; this system acts purely as the verifier of an attestation. Issuers are pluggable.

### 1.1 Non-Goals

- Direct JPKI certificate verification, revocation checking, or attribute retrieval
- Displaying legal names or guaranteeing their uniqueness
- Defending against card lending or coercion
- Writing to chain (**this specification contains no transaction submission whatsoever**)

---

## 2. Assurance Levels (renamed from v0.3)

| Value | Name | Basis | UI wording | Prior application |
|---|---|---|---|---|
| `none` | Unverified | None | Nothing shown | — |
| `wallet-control` | Wallet control confirmed | WalletConnect + ERC-1271 + eligibility E1–E4 | "MynaWallet control confirmed" | **Not required** |
| `identity-verified` | Existence verified | Signed issuer attestation + E5 | "Existence verified (at issuance)" | **Required** |

**`wallet-control` must never be labeled "JPKI verified."** All it proves is the ability to operate an official wallet account.

---

## 3. Two Authentication Layers

Two OAuth/OIDC-shaped relationships point in opposite directions. Do not conflate them.

```
┌─ Upstream (inbound): receiving proof of identity ────────┐
│   Issuer (IdP) ──attestation──▶ This system (RP)         │
│   · MynaWallet Mini Apps (spec unpublished)              │
│   · Digital Authentication App (authentication API)      │
│   · Stub (for P0)                                        │
│   → Prior application IS REQUIRED                        │
└──────────────────────────────────────────────────────────┘

┌─ Downstream (outbound): authenticating Bluesky clients ──┐
│   Our PDS (AS) ◀──authz request── Bluesky app            │
│   · AT Protocol OAuth profile                            │
│   · client_id = URL of the client metadata document      │
│   → Prior registration is NOT required                   │
└──────────────────────────────────────────────────────────┘
```

AT Protocol OAuth is designed so any client can be authorized against any PDS without prior registration. A client publishes a metadata JSON document on the public web and its URL *is* the `client_id`. There is no central registration authority.

**WalletConnect is neither of these.** It is a transport protocol, not an IdP, and requires no application (aside from the Reown project ID noted below).

---

## 4. Chain of Trust

```
J-LIS (issues JPKI certificates)
  └─▶ JPKI identity proofing at enrollment
        └─▶ MynaWallet's user / KYC state management     ← the actual locus of trust
              └─▶ Smart account controlled by a passkey
                    └─▶ WalletConnect (transport only)
                          └─▶ ERC-1271 (proves control only)
                                └─▶ This system
```

ERC-1271 proves only that the account's current controlling key produced a signature. It proves neither that a card was tapped nor that JPKI enrollment is still valid.

---

## 5. The Attestation Interface

### 5.1 `IdentityAttestation`

```json
{
  "iss": "mynawallet",
  "sub": "per-service stable anonymous ID (pairwise subject)",
  "aud": "https://poc.example.jp",
  "nonce": "binds to our challenge",
  "assurance": "jpki-enrolled",
  "wallet": { "caip10": "eip155:1:0xAbC..." },
  "authTime": "2026-08-10T12:00:00Z",
  "iat": "2026-08-10T12:00:05Z",
  "exp": "2026-08-10T12:10:00Z"
}
```

**`sub` is not an address.** Addresses fork across chains, salts, and re-creation. The UNIQUE constraint goes on `(iss, sub)`.

### 5.2 Issuer Adapters

| Adapter | Status | Notes |
|---|---|---|
| `stub` | Implemented in P0 | Development and testing only; disabled in production config |
| `mynawallet-miniapp` | Not started | Spec unpublished; early-partner program (OQ-1) |
| `digital-auth-app` | Not started | Requires an application; no Platform Operator needed for the authentication API |

Swapping issuers must be configuration only. Everything below the adapter layer — WalletConnect, PDS, did:plc, handles, OAuth — is issuer-independent.

---

## 6. Components

| # | Name | Role |
|---|---|---|
| C1 | `poc-web` | Signup UI. **Generates the WalletConnect pairing URI and renders the QR** |
| C2 | `auth-api` | Challenge issuance, signature verification, eligibility checks, attestation verification, account issuance |
| C3 | `attestation-adapters` | Per-issuer adapters |
| C4 | `pds` | Self-hosted AT Protocol PDS; also the Authorization Server |
| C5 | `dns-controller` | Provisions TXT records for handle subdomains |
| C6 | `labeler` | Ozone labeler (P2 onward; not used in P1) |

**External dependencies:** EVM RPC node (read-only), Reown project ID, plc.directory, authoritative DNS

---

## 7. WalletConnect Specification (new in v0.4)

### 7.1 Established Facts (from official help)

- MynaWallet supports WalletConnect
- It is delivered as a **"WalletConnect mini-app" on the home tab**, not as a settings item
- Two connection methods:
  - **Method 1:** Scan the QR shown on the PC using the mini-app's "Scan QR code"
  - **Method 2:** Copy the connection link (URI) and paste it into the mini-app's "Connect by entering URI"
- After connection approval, **a signature request may arrive** (conditions unclear in the documentation → OQ-2)
- The signature request confirms ownership and **incurs no gas fee**

### 7.2 Implementation Approach

**Do not invent a QR protocol.** MynaWallet's scanner is not a general-purpose QR reader; it expects a WalletConnect pairing URI (`wc:` scheme). Render the URI produced by the standard SDK.

| Item | Choice |
|---|---|
| SDK | Reown (formerly WalletConnect) Sign SDK / AppKit |
| Protocol | WalletConnect v2 |
| Project ID | Self-serve registration at `cloud.reown.com` (free, no review) |

> **Note:** Obtaining a Reown project ID is a registration, but it is issued instantly from a form with no review. It does not count as "prior application" in the sense of §3.

### 7.3 Pairing URI

```
wc:{topic}@2?relay-protocol=irn&symKey={symKey}
```

Render this string as a QR code, and **always pair it with a copy button** to support Method 2 from the official help. Users completing the flow on a single phone will use that path.

### 7.4 Session Proposal

```json
{
  "optionalNamespaces": {
    "eip155": {
      "chains": ["eip155:1", "eip155:8453", "eip155:137"],
      "methods": ["personal_sign", "eth_signTypedData_v4"],
      "events": ["accountsChanged", "chainChanged"]
    }
  }
}
```

**Always put chains in `optionalNamespaces`.** Including an unsupported chain in `requiredNamespaces` causes the wallet to reject the session proposal outright. MynaWallet's supported chains are unconfirmed (OQ-3), so avoid mandatory declarations.

**Propose both signing methods as optional.** Only `personal_sign` may be supported; fall back to it when `eth_signTypedData_v4` is unavailable.

### 7.5 Session Lifecycle

| Event | Handling |
|---|---|
| Pairing URI expiry | 5 minutes; regenerate the QR on expiry |
| Session established | Capture the CAIP-10 account (`eip155:1:0x...`) |
| Signature request | Send the challenge message via `personal_sign` |
| Disconnect | `disconnect` promptly after issuance; no long-lived session is needed |
| Connection failure | Offer both QR regeneration and the copy path |

**Terminate the session once the account is issued.** This system handles no assets, so there is no reason to keep the connection — a retained connection is pure attack surface.

### 7.6 Wallet Selection UX

In the official help, the flow goes through selecting "WalletConnect" from OpenSea's wallet list. Whether MynaWallet is listed in the Reown wallet registry is unconfirmed (OQ-4).

- **If listed:** show "MynaWallet" directly in the wallet list
- **If not listed:** show only the generic "WalletConnect" button, and **always include on-screen guidance: "Open the WalletConnect mini-app from the home tab of the MynaWallet app"**

Without that guidance in the latter case, users will get lost immediately. That it lives inside a mini-app is not self-evident.

---

## 8. UX Flow (new in v0.4)

### 8.0 Choosing a Connection Path

The two paths map to Method 1 (QR) and Method 2 (URI copy-paste) from the official help. **Which one applies is determined by the user's device setup, not offered as a choice.**

| Device setup | Path | Why |
|---|---|---|
| Laptop + phone | **QR (Method 1)** | Scan the PC's QR with the phone. Most intuitive |
| Phone only | URI copy-paste (Method 2) | **You cannot scan a QR displayed on your own screen** |

`poc-web` detects the device from viewport width and user agent and selects the default path. Detection can be wrong, so **always include a link to switch to the other path**.

### 8.1 Existing User, Laptop + Phone (Method 1, QR) — primary path

| # | Action | Surface |
|---|---|---|
| 1 | Click "Create a Bluesky account" | PC browser |
| 2 | Enter a handle (`alice`) | PC browser |
| 3 | "Continue with MynaWallet" → **a QR code appears** | PC browser |
| 4 | Open MynaWallet → home tab → WalletConnect mini-app | Phone |
| 5 | "Scan QR code" → scan the PC screen | Phone |
| 6 | Confirm the peer name on the connection request → approve | Phone |
| 7 | Approve the signature request with a passkey (Face ID) | Phone |
| 8 | PC screen advances automatically → done | PC browser |

**8 steps, 60–90 seconds perceived.** The v0.3 estimate of "5 steps, 20–30 seconds" was too optimistic. **Opening the mini-app adds two steps beyond a typical wallet connection.**

**Drop-off point:** Step 4. Some users will not find the WalletConnect mini-app. Place guidance with screenshots next to the QR (§7.6).

**QR display requirements:**

| Item | Requirement |
|---|---|
| Error correction level | M or higher; Q or higher if a logo overlays it |
| Rendered size | At least 200px actual |
| Time remaining | Count down the pairing URI TTL (5 minutes) |
| Expiry | Regenerate the QR automatically and prompt a re-scan |
| Companion | **Always include a copy-URI button** as an escape hatch when detection is wrong |

### 8.2 Existing User, Phone Only (Method 2, URI copy-paste)

| # | Action | Surface |
|---|---|---|
| 1 | Tap "Create a Bluesky account" | Browser |
| 2 | Enter a handle (`alice`) | Browser |
| 3 | "Continue with MynaWallet" → **copy the URI** | Browser |
| 4 | Open MynaWallet → home tab → WalletConnect mini-app | App |
| 5 | Paste into "Connect by entering URI" | App |
| 6 | Confirm the peer name on the connection request → approve | App |
| 7 | Approve the signature request with a passkey (Face ID) | App |
| 8 | Return to the browser → done | Browser |

**8 steps, 60–90 seconds perceived.** Same step count as Method 1, but **manually switching back and forth between apps feels heavier**.

**Drop-off point:** Step 8. The return to the browser is manual and users forget to go back. Whether a deep link can automate the return needs testing (OQ-10).

### 8.3 First-Time User

```
Install MynaWallet
  → JPKI identity proofing (tap card + PIN)
  → Register a passkey
  → the 8 steps in §8.1 or §8.2
```

**5–10 minutes perceived; drop-off will be high.** Design the PoC for existing users and exclude first-time acquisition from evaluation.

### 8.4 Re-login (currently the worst experience)

The interim implementation (R-2) shows a PDS password once for the user to store. **Signup finishes with a single passkey prompt, then re-login demands a pasted password** — a jarring break. It persists until R-1 in P2 (embedding wallet auth in the PDS OAuth screen).

State clearly in demos that re-login is an interim implementation.

---

## 9. Verification

### 9.1 Challenge

```
poc.example.jp wants you to sign in with your Ethereum account:
0xAbC...

Sign up for a Bluesky account.

URI: https://poc.example.jp/signup
Version: 1
Chain ID: 1
Nonce: 3d9f1a4c7e2b8056d4a1f93c6e0b7a25
Issued At: 2026-08-10T12:00:00Z
Expiration Time: 2026-08-10T12:10:00Z
Resources:
- urn:handle:alice.id.example.jp
- urn:plc-rotation-key:did:key:zQ3s...
- urn:pds:https://pds.example.jp
- urn:terms:v1
```

| Requirement | Detail |
|---|---|
| Nonce | **≥128 bits** (32 hex chars), CSPRNG, single use |
| TTL | 10 minutes |
| Chain ID | **Use the actual chainId from the established session.** Never hardcode |
| Signed payload | Include the handle, PLC rotation key, PDS endpoint, and terms version |
| Verification | Do not re-parse; confirm **byte-for-byte equality with the canonical message stored in the database** |

### 9.2 Signature Verification

```
1. Confirm the submitted message equals the stored canonical message exactly
2. Confirm the nonce is unconsumed and unexpired; mark it consumed
3. Compute the EIP-191 personal_sign hash
4. Check whether the account is deployed (eth_getCode)
   a. Deployed     → call isValidSignature(hash, sig) directly [primary path]
   b. Not deployed → ERC-6492 path [exception, §9.3]
5. Confirm the return value is 0x1626ba7e
```

> **Change from v0.3:** v0.3 treated ERC-6492 as the primary path and "the most likely place to get stuck." MynaWallet accounts are likely deployed at identity-proofing time, since gas for basic usage is sponsored by the operator. **The primary path now assumes a deployed account, and ERC-6492 is demoted to a fallback.** Confirm actual behavior in G0 (OQ-5).

### 9.3 ERC-6492 Path (exception)

```
i.   Extract the factory address and calldata from the payload
ii.  Check the factory against the allowlist FIRST
iii. Only if allowed, pass to UniversalSigValidator
```

**The ordering in ii is mandatory.** Never execute calldata from an unvetted factory first — even inside an `eth_call` simulation, that hands arbitrary code to the node.

### 9.4 Eligibility Checks

| # | Check | What it proves | Level |
|---|---|---|---|
| E1 | Factory allowlist match | Descends from official code | `wallet-control` |
| E2 | CREATE2 address recomputation | Address is not spoofed | ″ |
| E3 | Implementation code hash match (including post-UUPS-upgrade implementation) | The expected implementation is running | ″ |
| E4 | Chain allowlist match | On a supported chain | ″ |
| E5 | **Binding to KYC state** | **Identity has been proofed** | `identity-verified` |

> **E1–E4 cannot prove identity proofing.** The published earlier factory accepts an arbitrary modulus and salt, so an attacker can create an "official-factory-descended" account with their own RSA key. Only E5 closes this.

### 9.5 Attestation Verification (`identity-verified`)

| Check | Detail |
|---|---|
| Signature | Verified with the issuer's public key |
| `iss` | Present in the trusted-issuer list |
| `aud` | Matches our identifier |
| `nonce` | Identical to the §9.1 challenge |
| `exp` / `iat` / `authTime` | Within validity; `authTime` plausibly recent |
| `wallet.caip10` | Matches the CAIP-10 from the session |
| `(iss, sub)` | Not already present in `accounts` |

---

## 10. Bluesky Integration

### 10.1 Account Creation

The standard PDS `createAccount` generates and submits the PLC genesis operation internally and accepts a recovery key. **Do not implement it twice.**

```
POST /xrpc/com.atproto.server.createAccount
{
  "handle": "alice.id.example.jp",
  "email": "...",
  "password": "<high-entropy generated value>",
  "recoveryKey": "did:key:zQ3s...(user's rotation key)"
}
```

`recoveryKey` receives the rotation key from the signed challenge (§9.1), guaranteeing that what the user signed matches what gets registered.

### 10.2 Re-login

| Option | Description | Adoption |
|---|---|---|
| R-1 | Embed wallet authentication into our PDS's OAuth authorization screen | **Adopted in P2** |
| R-2 | For the PoC only, generate a PDS password and present it once over a secure path | Interim for P0/P1 |

Because the PDS doubles as the Authorization Server, authorization requests from the official Bluesky app follow the AT Protocol OAuth profile. No client-side pre-registration is needed.

### 10.3 Handles

- Format: `<label>.id.example.jp`
- Regex: `^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])$` (minimum 3 characters; adjust if 1–2 are needed)
- Reject reserved words and labels resembling public figures or company names
- Discourage legal names (the did:plc log is permanently public)
- DNS TXT `_atproto.<label>.id.example.jp` = `did=did:plc:...`

### 10.4 Labels

- **P1:** Domain handles only — the sole signal visible unconditionally in standard clients
- **P2:** Add the Ozone labeler (subscribers only)
- **Official blue badge:** A separate Trusted Verifier program exists; out of scope

---

## 11. Data Model

### 11.1 `challenges`

| Column | Type | Notes |
|---|---|---|
| `nonce` | text | PK, ≥128 bits |
| `canonical_message` | text | For byte-for-byte comparison |
| `caip10_account` | text | From the session |
| `wc_session_topic` | text | WalletConnect session identifier |
| `handle_label` | text | |
| `rotation_key` | text | The did:key in the signed payload |
| `consumed_at` | timestamptz | Only NULL accepted |
| `expires_at` | timestamptz | 10-minute TTL |

### 11.2 `accounts`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `issuer` | text | Attestation issuer; `null` for `wallet-control` only |
| `pairwise_subject` | text | |
| `assurance` | text | `none` / `wallet-control` / `identity-verified` |
| `caip10_account` | text | |
| `did` | text | |
| `handle` | text | UNIQUE |
| `verified_at` / `expires_at` / `revoked_at` | timestamptz | |

**UNIQUE constraint: `(issuer, pairwise_subject)`.** Accounts with `issuer = null` carry no uniqueness guarantee; the UI must say so.

---

## 12. Threat Model

| ID | Threat | Mitigation | Residual risk |
|---|---|---|---|
| T1 | Bypass via a hand-rolled `isValidSignature` contract | E1–E4 | Medium |
| T1b | **Creating an "official-descended" account with a self-made RSA key via the official factory** | Only E5 addresses this; `wallet-control` cannot | **High at `wallet-control`, Low at `identity-verified`** |
| T2 | Signing up with someone else's address | Manual entry removed; account comes from the session | Low |
| T3 | Signature replay | Single-use 128-bit nonce, TTL, exact canonical-message match | Low |
| T4 | Reuse of a signature from another site | `domain` / `URI` / `aud` validation | Low |
| T5 | **Account remains valid after card revocation, loss, or death** | Re-signing at expiry **is not a JPKI re-check**; requires the issuer's current-KYC API or re-KYC | **High** |
| T6 | Card lending, coercion, or sale | Relies on the issuer's two factors | High |
| T7 | Full dependence on the issuer's proofing quality | Audit the delegate; confirm contracts | Medium |
| T8 | Impersonation via display name | **Not implementable** — without the legal name, correctness cannot be judged. State that the label does not certify real names | Accepted |
| T9 | Executing calldata from an unvetted factory | Follow the ordering in §9.3 ii | Low |
| T10 | Chain reorg or tampered RPC responses | Query multiple RPCs | Low |
| T11 | **QR relay attack** (victim scans the attacker's QR) | `domain` / `URI` inside the signed payload; user confirms the peer name on the approval screen | Medium |
| T12 | Pairing URI leakage | 5-minute TTL; `disconnect` immediately after issuance | Low |

### 12.1 Limits of the Guarantee

**`wallet-control` guarantees:**
> "A party able to operate an official MynaWallet account controls this DID."

**`identity-verified` guarantees:**
> "A party the issuer identity-proofed controls this DID, and holds exactly one account (as of issuance)."

**Neither guarantees:** correctness or uniqueness of names, that proofing is still valid now, or that the key has not been transferred.

---

## 13. Implementation Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **G0** | **Feasibility gate** — clear the items in §14 on real hardware | OQ-2 through OQ-6 resolved |
| **P0** | Dummy SCW + stub issuer + PDS issuance + re-login (R-2) | Works end-to-end locally; claims no JPKI assurance |
| **P1** | WalletConnect, E1–E4, domain handles | `wallet-control`; handle renders in the official app |
| **P1.5** | Issuer adapter, E5, pairwise subject | `identity-verified` can be claimed |
| **P2** | PDS OAuth (R-1), revocation, labeler | Re-login works through the proper path |
| **P3** | User-held rotation key operations, recovery flow | Sovereign recovery works |

---

## 14. G0 Checklist (hands-on verification)

**Estimated effort: half a day.** Connecting MynaWallet to OpenSea once and pushing a single signature through answers most of this.

| # | What to confirm | How |
|---|---|---|
| G0-1 | Supported chains (CAIP-2 list) | Record `namespaces` at session establishment |
| G0-2 | Supported signing methods (`personal_sign` / `eth_signTypedData_v4`) | Propose both as optional and observe |
| G0-3 | **Format of the returned signature** (raw ECDSA / ERC-1271-oriented / ERC-6492-wrapped) | Inspect the signature tail for the ERC-6492 magic suffix |
| G0-4 | Whether the account is deployed | `eth_getCode` |
| G0-5 | Factory address and implementation code hash | Trace the deployment transaction |
| G0-6 | Presence in the Reown wallet registry | Search the Reown explorer |
| G0-7 | Conditions under which a signature request "may arrive" | Repeat trials and record behavior |

**G0-3 matters most.** Whether an ERC-6492 wrapper appears or a raw signature returns determines the §9.2 implementation.

---

## 15. Acceptance Criteria

| ID | Criterion | Phase |
|---|---|---|
| AC1 | Connection succeeds via both QR and copy paths, and a DID is issued after signing | P1 |
| AC2 | No manual address entry field exists | P0 |
| AC3 | A contract whose `isValidSignature` always succeeds is rejected | P1 |
| AC4 | Altering the submitted message by one byte causes rejection | P0 |
| AC5 | A second submission of the same nonce is rejected | P0 |
| AC6 | A signature issued for another domain is rejected | P0 |
| AC7 | A non-allowlisted factory is rejected before reaching UniversalSigValidator | P1 |
| AC8 | Proposing unsupported chains does not break session establishment | P1 |
| AC9 | The WalletConnect session is disconnected after issuance | P1 |
| AC10 | The custom domain handle renders in the official Bluesky app | P1 |
| AC11 | **After logging out of the official app, the user can log back in** | P0 |
| AC12 | The `recoveryKey` matches the rotation key in the signed payload | P1 |
| AC13 | Stub-issuer accounts show no `identity-verified` wording | P0 |
| AC14 | A second registration with the same `(issuer, pairwise_subject)` is rejected | P1.5 |
| AC15 | A full-text scan finds no My Number, four basic attributes, or certificates | P1 |

---

## 16. Open Questions

| ID | Question | Impact | Ask |
|---|---|---|---|
| OQ-1 | Mini Apps specification, timeline, partner terms | How `identity-verified` gets built (**High**) | MynaWallet |
| OQ-2 | Conditions under which a signature request "may arrive" | Flow reliability (**High**) | G0-7 |
| OQ-3 | List of supported chains | Session proposal (**High**) | G0-1 |
| OQ-4 | Presence in the Reown wallet registry | Connection UX (Medium) | G0-6 |
| OQ-5 | Account deployment status and signature format | §9.2 implementation (**High**) | G0-3, G0-4 |
| OQ-6 | Factory address and implementation code hash | E1–E3 (**High**) | G0-5 |
| OQ-7 | Whether current KYC state can be checked externally | E5, T5 (**High**) | MynaWallet |
| OQ-8 | Does the pairwise subject survive card reissuance and account recovery? | Sybil resistance (High) | MynaWallet |
| OQ-9 | Requirements and lead time for a Digital Authentication App application | Alternate issuer (Medium) | Digital Agency |
| OQ-10 | Can a deep link return the user to the browser automatically after signing (Method 2)? | Phone-only drop-off (Medium) | Confirm in G0 |

---

## 17. References

- WalletConnect v2 / Reown SDK documentation
- ERC-4337 / ERC-1271 / ERC-6492 / EIP-4361 / CAIP-2 / CAIP-10
- AT Protocol: OAuth specification, Cryptography, did:plc Specification v0.1
- Bluesky: OAuth Client Implementation guide
- MynaWallet official site, help pages (OpenSea connection guide), terms of service

> Regulatory interpretations here are working notes for technical planning, not legal advice. Confirm with counsel before implementation.
