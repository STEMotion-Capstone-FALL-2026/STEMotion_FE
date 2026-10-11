# Backend API specification — verified local snapshot 2026-10-11

This replaces the previous design/mock specification. Canonical machine-readable request/response schemas: [BE OpenAPI](../STEMotion_BE/docs/api/openapi.json). Exported from the current packaged Spring Boot application at local `/v3/api-docs`; **61 operations**, not an assertion about the deployed production version. The snapshot is generated, so controller/service authorization rules below remain necessary; Springdoc does not infer all runtime role/ownership checks.

## Connection and responses

```env
VITE_API_BASE_URL=https://stemotion-be.onrender.com/api/v1
```

Local base URL: `http://localhost:8080/api/v1`. FE appends endpoint paths; do not repeat `/api/v1`. Successful responses are plain objects/arrays, not a required `{success,data}` wrapper. FE also tolerates a data wrapper for compatibility. Typical service errors: `{status,code,message,timestamp}`; security filter 401/403 may have no JSON. Handle 204 without parsing a body. JWT is sent as `Authorization: Bearer <token>`. No provider/service secrets belong in Vite variables.

## Authorization and lifecycle

- `POST /auth/login` is public; accounts are provisioned through ADMIN-only `POST /users`. `POST /auth/register` remains documented for compatibility but is denied to everyone, including ADMIN. FE has no signup flow.
- Authenticated reads also enforce resource/workspace access in services. WRITER/ADMIN create/save/submit scripts; REVIEWER/ADMIN access review queue and approve/request changes. Draft scene IDs remain stable. Removing a scene with feedback is rejected. Deleting a project archives it and preserves history.
- All `/ai/**` calls require WRITER/ADMIN. A decision additionally requires request ownership or ADMIN. Analysis never automatically changes the script. Record ACCEPTED only when the human accepts; IGNORED when rejected. The create-from-AI UI records ACCEPTED after saving the project.
- PRODUCER/ADMIN start/retry/cancel renders and publish. REVIEWER/ADMIN approve/send back video. ADMIN-only user mutations, template metadata mutations and metrics; `GET /users/{id}` permits ADMIN or self. Workspace owner/membership/invitation rules are service-enforced, not broad ADMIN CRUD permission.
- Worker callback is JWT-exempt but requires `X-Render-Api-Key`. Worker compute endpoints require `X-Api-Key`; FastAPI private generation requires `X-AI-Api-Key`. These credentials stay server-side.
- Dual script/video statuses drive pipeline display. Review events are append-only `status_histories` with explicit event/target/decision/reason, even when derived pipeline stage stays unchanged. Clip review binds the rendered artifact, not merely a project title.

## New/changed contracts

AI responses add `requestId` alongside action/result/model/elapsedMs. Decision:

```http
PUT /api/v1/ai/requests/{requestId}/decision
Content-Type: application/json
Authorization: Bearer <JWT>

{"decision":"ACCEPTED"}
```

Returns `{requestId,decision}`. IGNORED is also valid; PENDING/null is 400. Repeating the same decision is idempotent. Changing a terminal decision or deciding a failed call is 409; another requester is 403. Gateway records one audit row per logical request, including failed calls; bounded provider retries belong to that row. Tokens reflect provider metadata, unknown values and monetary cost remain NULL. Worker TTS/QA hooks are not yet included in this gateway audit.

`POST /render/projects/{projectId}/start` optionally takes `{resolution,fps,ttsVoice}` and returns 202 + RenderJobResponse. New jobs/retries are normalized to **1920x1080/30fps**; draft frame counts are rescaled to preserve seconds. Worker rejects unsupported dimensions/FPS. Optional voice reaches the actual provider; missing voice uses worker configuration. Worker availability is required; do not synthesize fake success URLs.

Publishing takes `{targets,title,description}`. INTERNAL_LIBRARY is real, writes canonical `publications` plus the legacy `publish_records` adapter, and preserves LMS embeds. YOUTUBE returns 503 `PUBLISH_TARGET_UNAVAILABLE` until OAuth/upload is implemented. Current uniqueness is `(project_id,platform)`; future Clip-based uniqueness is a separate migration, not enabled by this fix. QA is metadata/heuristic only, not full decoded artifact, contrast or caption-sync verification.

Template metadata uses `subject`, `assetPack`, `slots` in addition to existing fields. `propsSchema` and `slots` remain JSON-encoded strings in this compatibility API. CRUD does not install arbitrary executable React code; shared director registry still supplies the allowlist.

## Endpoint catalogue (generated from local OpenAPI)

Paths below include the full `/api/v1` prefix. Schemas refer to components in the linked JSON. Pagination/query/path parameters and required properties are in that JSON.

| Method | Path | Request JSON | Success response | Summary |
|---|---|---|---|---|
| GET | `/api/v1/admin/metrics` | - | 200 SystemMetrics | Render queue, throughput and host resource usage |
| GET | `/api/v1/ai/health` | - | 200 object | Whether an AI key is configured on this environment |
| PUT | `/api/v1/ai/requests/{requestId}/decision` | AiDecisionRequest | 200 object | Accept or ignore an owned AI suggestion (does not save script content) |
| POST | `/api/v1/ai/script/action` | ScriptActionRequest | 200 AiActionResponse | Run resegment, grade, extract or terms over a script |
| POST | `/api/v1/ai/script/generate` | GenerateScriptRequest | 200 AiActionResponse | Draft a full STEM script from a topic |
| POST | `/api/v1/auth/login` | LoginRequest | 200 AuthResponse | Exchange email and password for a JWT |
| GET | `/api/v1/auth/me` | - | 200 UserResponse | Return the profile of the authenticated user |
| POST | `/api/v1/auth/register` | RegisterRequest | 200 AuthResponse | Disabled: accounts are provisioned by administrators |
| GET | `/api/v1/library/clips` | - | 200 Array<LibraryItem> | List published clips, filtered by subject and grade |
| GET | `/api/v1/library/clips/{projectId}` | - | 200 LibraryItem | One published clip, with its export links |
| GET | `/api/v1/library/filters` | - | 200 LibraryFilters | Subjects and grades that actually have published clips |
| DELETE | `/api/v1/qa-comments/{commentId}` | - | 200 - | delete_4 |
| PUT | `/api/v1/qa-comments/{commentId}/reopen` | - | 200 FeedbackResponse | reopen |
| PUT | `/api/v1/qa-comments/{commentId}/resolve` | - | 200 FeedbackResponse | resolve |
| POST | `/api/v1/render/callback` | RenderCallbackRequest | 200 RenderJobResponse | Progress update pushed by the render worker (secured by X-Render-Api-Key header) |
| DELETE | `/api/v1/render/jobs/{jobId}` | - | 200 - | cancel |
| POST | `/api/v1/render/jobs/{jobId}/retry` | - | 200 RenderJobResponse | retry |
| GET | `/api/v1/render/projects/{projectId}/jobs` | - | 200 Array<RenderJobResponse> | Render history of a project |
| POST | `/api/v1/render/projects/{projectId}/start` | StartRenderRequest | 200 RenderJobResponse | Queue a render of the approved script |
| GET | `/api/v1/render/status/{jobId}` | - | 200 RenderJobResponse | Poll render progress |
| GET | `/api/v1/scenes/{sceneId}/comments` | - | 200 Array<FeedbackResponse> | Inline comments on one scene |
| GET | `/api/v1/scripts/mine` | - | 200 Array<ScriptSummaryResponse> | Scripts owned by the authenticated writer |
| GET | `/api/v1/scripts/review-queue` | - | 200 Array<ScriptSummaryResponse> | Scripts waiting for an editorial decision |
| DELETE | `/api/v1/scripts/{id}` | - | 200 - | delete_3 |
| GET | `/api/v1/scripts/{id}` | - | 200 ScriptResponse | Full script with its ordered scenes |
| PUT | `/api/v1/scripts/{id}` | UpdateScriptRequest | 200 ScriptResponse | Save the working draft, replacing the scene list |
| POST | `/api/v1/scripts/{id}/approve` | ReviewDecisionRequest | 200 ScriptResponse | Reviewer approves the script |
| GET | `/api/v1/scripts/{id}/diff` | - | 200 VersionDiffResponse | Two versions side by side for the diff view |
| POST | `/api/v1/scripts/{id}/request-changes` | ReviewDecisionRequest | 200 ScriptResponse | Reviewer returns the script and opens a new version |
| POST | `/api/v1/scripts/{id}/submit-review` | - | 200 ScriptResponse | Writer submits the draft for review |
| GET | `/api/v1/scripts/{id}/versions` | - | 200 Array<ScriptVersionResponse> | Version history of a script |
| POST | `/api/v1/scripts/{projectId}/approve-video` | ReviewDecisionRequest | 200 - | Sign off the rendered clip once every note is resolved |
| GET | `/api/v1/scripts/{projectId}/publications` | - | 200 Array<PublishResponse> | history |
| POST | `/api/v1/scripts/{projectId}/publish` | PublishRequest | 200 PublishResponse | Publish an approved clip to the selected targets |
| GET | `/api/v1/scripts/{projectId}/qa-comments` | - | 200 Array<FeedbackResponse> | Review notes pinned to a clip |
| POST | `/api/v1/scripts/{projectId}/qa-comments` | FeedbackRequest | 200 FeedbackResponse | Pin a note at a timecode or on a scene |
| GET | `/api/v1/scripts/{projectId}/qa-report` | - | 200 QaReport | Run the automated pre-publish checks |
| POST | `/api/v1/scripts/{projectId}/send-back` | ReviewDecisionRequest | 200 - | Return the clip to the producer for a re-render |
| GET | `/api/v1/templates` | - | 200 Array<TemplateResponse> | findAll_2 |
| POST | `/api/v1/templates` | TemplateRequest | 200 TemplateResponse | create_3 |
| DELETE | `/api/v1/templates/{id}` | - | 200 - | delete_2 |
| GET | `/api/v1/templates/{id}` | - | 200 TemplateResponse | findById_2 |
| PUT | `/api/v1/templates/{id}` | TemplateRequest | 200 TemplateResponse | update_1 |
| GET | `/api/v1/users` | - | 200 Array<UserResponse> | findAll_1 |
| POST | `/api/v1/users` | RegisterRequest | 200 UserResponse | create_2 |
| DELETE | `/api/v1/users/{id}` | - | 200 - | delete_1 |
| GET | `/api/v1/users/{id}` | - | 200 UserResponse | findById_1 |
| PATCH | `/api/v1/users/{id}` | UpdateUserRequest | 200 UserResponse | update_3 |
| POST | `/api/v1/workspace-invitations/accept` | AcceptInvitationRequest | 200 MemberResponse | accept |
| GET | `/api/v1/workspaces` | - | 200 Array<WorkspaceResponse> | findAll |
| POST | `/api/v1/workspaces` | WorkspaceRequest | 200 WorkspaceResponse | create |
| GET | `/api/v1/workspaces/mine` | - | 200 Array<WorkspaceResponse> | Workspaces the authenticated user belongs to |
| DELETE | `/api/v1/workspaces/{id}` | - | 200 - | delete |
| GET | `/api/v1/workspaces/{id}` | - | 200 WorkspaceResponse | findById |
| PUT | `/api/v1/workspaces/{id}` | WorkspaceRequest | 200 WorkspaceResponse | update |
| GET | `/api/v1/workspaces/{id}/members` | - | 200 Array<MemberResponse> | members |
| POST | `/api/v1/workspaces/{id}/members` | InviteMemberRequest | 200 InvitationResponse | Invite a teacher by email |
| DELETE | `/api/v1/workspaces/{id}/members/{memberId}` | - | 200 - | removeMember |
| PATCH | `/api/v1/workspaces/{id}/members/{memberId}` | UpdateMemberRequest | 200 MemberResponse | updateMember |
| GET | `/api/v1/workspaces/{workspaceId}/scripts` | - | 200 Array<ScriptSummaryResponse> | List the scripts of a workspace |
| POST | `/api/v1/workspaces/{workspaceId}/scripts` | CreateScriptRequest | 200 ScriptResponse | Create a clip project and its first script version |

## Other surfaces and limits

Health/readiness are operational endpoints outside this catalogue: GET `/actuator/health` and `/actuator/health/readiness`, expected 200/UP. FastAPI currently has GET `/health` and POST `/internal/v1/generate` only; segmentation/analysis are BE tasks dispatched through generic structured generation. Dedicated TTS/caption/QA hooks and Whisper are not implemented. Its [OpenAPI snapshot](../STEMotion_BE/services/ai/docs/openapi.json) describes nullable inputTokens/outputTokens/totalTokens. AI service lives in `STEMotion_BE/services/ai`; provider Gemini is an approved initial substitution for the proposal's GPT provider.

Local acceptance evidence: [M01](../STEMotion_BE/docs/TRACK2_M01_2026-10-11.md), [M14](../STEMotion_BE/docs/TRACK2_M14_2026-10-11.md), [test report](../STEMotion_BE/docs/TEST_REPORT_2026-10-11.md). Local API boot used loopback PostgreSQL with schema V14, Flyway disabled and datasource read-only; no production requests or writes were needed to export this file.
