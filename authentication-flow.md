# Authentication Flows

This repository has separate HR and applicant authentication systems. Both issue signed JWTs in HTTP-only cookies, but HR credentials come from configuration while applicants prove access with an emailed one-time code.

## Flowchart

### HR authentication and route guard

```mermaid
flowchart TD
    HrStart([Start])
    HrCredentials[/Submit HR credentials/]

    subgraph HrFrontend["Frontend"]
        HrAction[Run loginAction]
        HrStore[Set hr_token cookie]
        HrRedirect[Redirect to admin]
        HrRead[Read hr_token cookie]
        HrCookie{Cookie present?}
        HrSession[/Request GET /auth/me/]
        HrDelete[Delete stale cookie]
        HrLogin[/Show login page/]
        HrRender[/Render HR route/]
    end

    subgraph HrBackend["Backend"]
        HrLoginRequest[/POST /auth/login/]
        HrCompare[Compare configured credentials]
        HrCredentialsValid{Credentials valid?}
        HrSign[Sign HS256 JWT]
        HrToken[/Return token and expiry/]
        HrInvalid[/Return 401 response/]
        HrVerify[Verify HS256 JWT]
        HrTokenValid{Token valid?}
        HrSessionResponse[/Return session email/]
    end

    HrDenied([End: unauthenticated])
    HrAllowed([End: HR route available])

    HrStart --> HrCredentials
    HrCredentials --> HrAction
    HrAction --> HrLoginRequest
    HrLoginRequest --> HrCompare
    HrCompare --> HrCredentialsValid
    HrCredentialsValid -->|No| HrInvalid
    HrInvalid --> HrAction
    HrCredentialsValid -->|Yes| HrSign
    HrSign --> HrToken
    HrToken --> HrStore
    HrStore --> HrRedirect
    HrRedirect --> HrRead
    HrRead --> HrCookie
    HrCookie -->|No| HrLogin
    HrCookie -->|Yes| HrSession
    HrSession --> HrVerify
    HrVerify --> HrTokenValid
    HrTokenValid -->|No| HrDelete
    HrDelete --> HrLogin
    HrLogin --> HrDenied
    HrTokenValid -->|Yes| HrSessionResponse
    HrSessionResponse --> HrRender
    HrRender --> HrAllowed
```

### Applicant OTP authentication and protected API access

```mermaid
flowchart TD
    ApplicantStart([Start])
    ApplicantIdentity[/Submit application ID and email/]

    subgraph ApplicantFrontend["Frontend"]
        ApplicantRequest[/POST /applicant-auth/request-code/]
        ApplicantCode[/Submit six-digit code/]
        ApplicantVerifyRequest[/POST /applicant-auth/verify-code/]
        ApplicantDashboard[/Open applicant dashboard/]
        ApplicantRequestData[/Request applicant data/]
    end

    subgraph ApplicantBackend["Backend"]
        ApplicantValidate[Validate identity input]
        ApplicantIdentityValid{Identity valid?}
        ApplicantBadRequest[/Return 400 response/]
        ApplicantLookup[Find applicant identity]
        ApplicantFound{Identity found?}
        ApplicantAllowed{Request allowed?}
        ApplicantStore[Store hashed OTP challenge]
        ApplicantEmail[Send OTP email]
        ApplicantAccepted[/Return generic 202/]
        ApplicantLimited[/Return 429 response/]
        ApplicantChallenge[Load active OTP challenge]
        ApplicantMatches{Code matches?}
        ApplicantInvalid[/Return 401 response/]
        ApplicantConsume[Consume OTP challenge]
        ApplicantSign[Sign applicant JWT]
        ApplicantSet[Set applicant_token cookie]
        ApplicantVerified[/Return verification response/]
        ApplicantToken[Verify token and scope]
        ApplicantTokenValid{Applicant token valid?}
        ApplicantHandler[Run applicant handler]
        ApplicantUnauthorized[/Return 401 response/]
    end

    subgraph ApplicantData["PostgreSQL"]
        ApplicantRecords[(Applications and applicants)]
        ApplicantChallenges[(OTP challenges)]
    end

    ApplicantEnd([End])

    ApplicantStart --> ApplicantIdentity
    ApplicantIdentity --> ApplicantRequest
    ApplicantRequest --> ApplicantValidate
    ApplicantValidate --> ApplicantIdentityValid
    ApplicantIdentityValid -->|No| ApplicantBadRequest
    ApplicantBadRequest --> ApplicantEnd
    ApplicantIdentityValid -->|Yes| ApplicantLookup
    ApplicantLookup --> ApplicantRecords
    ApplicantRecords --> ApplicantFound
    ApplicantFound -->|No| ApplicantAccepted
    ApplicantFound -->|Yes| ApplicantAllowed
    ApplicantAllowed -->|No| ApplicantLimited
    ApplicantLimited --> ApplicantEnd
    ApplicantAllowed -->|Yes| ApplicantStore
    ApplicantStore --> ApplicantChallenges
    ApplicantChallenges --> ApplicantEmail
    ApplicantEmail --> ApplicantAccepted
    ApplicantAccepted --> ApplicantCode
    ApplicantCode --> ApplicantVerifyRequest
    ApplicantVerifyRequest --> ApplicantChallenge
    ApplicantChallenge --> ApplicantChallenges
    ApplicantChallenges --> ApplicantMatches
    ApplicantMatches -->|No| ApplicantInvalid
    ApplicantInvalid --> ApplicantEnd
    ApplicantMatches -->|Yes| ApplicantConsume
    ApplicantConsume --> ApplicantChallenges
    ApplicantConsume --> ApplicantSign
    ApplicantSign --> ApplicantSet
    ApplicantSet --> ApplicantVerified
    ApplicantVerified --> ApplicantDashboard
    ApplicantDashboard --> ApplicantRequestData
    ApplicantRequestData --> ApplicantToken
    ApplicantToken --> ApplicantTokenValid
    ApplicantTokenValid -->|No| ApplicantUnauthorized
    ApplicantUnauthorized --> ApplicantEnd
    ApplicantTokenValid -->|Yes| ApplicantHandler
    ApplicantHandler --> ApplicantEnd
```

## Flow

1. The HR login form submits credentials to the Next.js `loginAction`, which calls the backend directly. The backend compares them with `HR_EMAIL` and `HR_PASSWORD`; no user-table lookup occurs in this flow.
2. A valid HR login produces an HS256 JWT whose subject is the normalized email. The server action stores the returned token in the frontend's HTTP-only `hr_token` cookie and redirects to `/admin/hr/overview`.
3. The protected HR layout calls `/auth/me` with that cookie. `requireAuth` accepts `hr_token` or a Bearer token, verifies it with `JWT_SECRET`, and allows the layout only when it is valid; failed session checks remove the frontend cookie and redirect to `/login`.
4. Applicant access begins with an application code and email. The backend looks up the application, applies resend and hourly limits, stores only an HMAC hash of a newly generated OTP, and attempts to email the plaintext code. Unknown identities receive the same generic accepted response, so the endpoint does not reveal whether an application exists.
5. The applicant submits the six-digit code. A matching unexpired, unconsumed OTP is atomically consumed before the backend signs an applicant-scoped HS256 JWT and sets the HTTP-only `applicant_token` cookie.
6. Applicant application and interview endpoints use `requireApplicantAuth`. It accepts only `applicant_token`, verifies its signature and `scope: "applicant"`, then supplies the application identity to the route handler; missing, expired, malformed, or wrong-scope tokens return 401.
7. Both frontend API clients use `credentials: "include"`; browser `/api/*` requests are rewritten to the backend. HR server actions and server-side session checks instead call the configured backend URL directly.

## Code References

- `frontend/next.config.ts` — rewrites browser `/api/:path*` requests to the backend.
- `frontend/src/app/(site)/login/login-form.tsx` — submits HR credentials through `loginAction`.
- `frontend/src/app/(site)/login/actions.ts` — `loginAction()` stores `hr_token`; `logoutHrSession()` clears it.
- `frontend/src/lib/session-server.ts` — `getServerSession()` checks HR access with `GET /auth/me`.
- `frontend/src/app/(site)/admin/hr/layout.tsx` — redirects unauthenticated HR requests to `/login`.
- `frontend/src/lib/api-client.ts` — browser HR API requests include credentials and redirect after protected-route 401 responses.
- `backend/src/app.ts` — defines HR `/auth/login`, `/auth/me`, and `/auth/logout`; mounts applicant routes.
- `backend/src/auth.ts` — HR credential comparison, JWT signing/verification, cookie options, and `requireAuth`.
- `frontend/src/components/apply/access/applicant-access-form.tsx` — starts applicant OTP verification.
- `frontend/src/components/apply/access/applicant-code-form.tsx` — verifies the OTP and opens the applicant dashboard.
- `frontend/src/lib/applicant-auth-api.ts` — frontend calls for applicant OTP and session endpoints.
- `backend/src/routes/applicant-auth.ts` — applicant OTP request, verification, session, and logout routes.
- `backend/src/lib/applicant-otp.ts` — applicant lookup, OTP limits, hashed challenge storage, verification, and consumption.
- `backend/src/applicant-auth.ts` — applicant JWTs and `requireApplicantAuth` middleware.
- `backend/src/routes/applicant-application.ts` and `backend/src/routes/applicant-interview.ts` — applicant-token-protected application and interview endpoints.
- `backend/src/db/schema.ts` — `applications`, `applicants`, and `applicantOtpChallenges` schema definitions.
