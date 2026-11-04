# TICKET-032 access contract

## Layers

Proxy rejects clearly unauthorized requests using verified credentials. It is not
an authorization grant: admin operations consult live Auth user/factor/allowlist
state, and staff operations consult current staff/device role, expiry, revocation
and credential version. No incoming role/header is trusted.

Admin request cookies use Supabase verified claims, not getSession. Refreshed
cookies are forwarded to the request and response. Only exact sign-in, sign-out
and MFA entry paths bypass the AAL2 prefilter; their actions retain their existing
bootstrap checks. AAL1 can establish MFA but cannot read wedding admin data.

Exact /checkin, /kitchen and /bar roots host the PIN entry form and remain reachable.
Their StaffEntry content calls currentStaff before rendering station content.
Descendants and station API prefixes require a matching signed, unexpired,
device-bound session at proxy. These prefixes reserve protection for future routes;
this ticket does not implement scanner or station APIs. A valid cookie cannot
replace live authorization when an operation reads or writes data.

## Current operation inventory

| Surface                                          | Required authority                                                                     | Data exposed                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Admin dashboard and sharing reader               | Live allowlisted user, verified claims, AAL2 and verified TOTP factor                  | Admin-only content; sharing bearer links remain private    |
| Future admin actions/handlers                    | withCurrentAdminAccess inside the operation                                            | Callback runs only for live ready admin                    |
| Staff entry content                              | currentStaff for that station                                                          | Signed-in placeholder only after live checks               |
| Future staff actions/handlers                    | withStaffAccess inside the operation                                                   | Callback receives only staff identity/role/version         |
| Admin OTP sign-in                                | Exact email allowlist and OTP                                                          | Sign-in state only                                         |
| MFA enroll/verify actions                        | Live allowlisted authenticated user; factor ownership; existing bootstrap restrictions | Own enrollment only, no wedding data                       |
| Staff PIN sign-in                                | Valid role, device lockout, PIN and current credential/device/event validity           | Own scoped session only                                    |
| Sign-out                                         | Current browser cookie removal                                                         | No privileged data                                         |
| RSVP/party actions and invitation pass endpoints | Valid invitation capability and existing business rules                                | Only that invitation; malformed/absent tokens fail         |
| Public pass display                              | Signed pass credential and existing version checks                                     | Read-only pass; no invitation editing capability           |
| Menu availability                                | Public item availability                                                               | No guests or households                                    |
| POST /api/orders and table selection             | Anonymous allowed; bounded validated input and existing order rules                    | Submission result only; GET /api/orders is not implemented |

No general household-status endpoint exists yet. New endpoints must apply their
own scoped lookup and response minimization; no general guest privilege is inferred
from a session or possession of some other invitation's capability. Abuse/rate-limit
implementation remains its existing tickets, not an added login requirement.

## Verification so far

- New request regressions initially failed 8/9 cases on develop's proxy.
- Request and direct-operation matrix: 53 passing tests.
- Production anonymous access/guest endpoint matrix: 4 passes (mobile + desktop).
- Real gate/kitchen/bar sign-in, cross-role denial and live credential-version revocation: 2 passes (15.1s).
- Real local admin OTP/TOTP, AAL1 restrictions and AAL2 upgrade: 2 passes (1.1m).
- Real anonymous ordering, lost responses, retry idempotency and sold-out rejection: 6 passes (58.4s).
- Full local verification: 948 unit passes / 74 opt-in skips; 779 browser passes / 165 opt-in skips (9.4m).
- CI run 41752790966 on 40bbd79: all five jobs passed, including the invitation/RSVP/pass journey in both browser projects.
- Initial staff journey failed twice waiting for a PIN response while PostgreSQL was unhealthy and pg_isready reported no response. After health recovered, the unchanged test passed. Logs retain both results; no assertion or timeout was weakened.
- Ordering images use artifacts/TICKET-032/ordering via the new optional ORDER_REVIEW_DIR; existing TICKET-072 evidence is untouched.
- No visual layout, database schema, policy, CI or production configuration changes.
