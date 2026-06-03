# The Operating Record Ledger System

The core of Oxecute is an append-only operating ledger storing verified founder actions. The design enforces rigorous rules to prevent spoofing, duplicate daily logs, or modifications of past history.

---

## Ledger Rules & Invariants

### 1. Strict UTC-Day Gating
Founders are restricted to **one submission per UTC calendar day**.
*   When a new manual entry is requested, the server checks if the user's `last_submission_date` in the database matches the current UTC date string (`YYYY-MM-DD`).
*   If they have already submitted today, additional submissions are blocked.
*   **Exception**: Upgrading an existing entry (such as a Declaration to a Verified Proof) or upgrading the initial Day 1 signup placeholder is permitted even if a submission has been made today.

### 2. Day 1 Signup Placeholder Upgrade
When a user registers, the system records their Day 1 start by inserting a placeholder entry with the tier `signup_execution` and text: *"Signed up and activated Conexa. Record starts here."*
*   If the user submits an actual proof on Day 1, the backend **updates** this placeholder row directly (changing the tier, category, text, and validation hash) to avoid cluttering the ledger with redundant startup rows.

### 3. Cryptographic Validation Hashing
Every entry written to the ledger is signed with a SHA-256 validation hash computed on insert/update. This locks the entry data and creation timestamp:
*   **Verified URL**: `SHA-256(url + createdAtIso)`
*   **Declaration**: `SHA-256(declaration_text + createdAtIso)`
*   **File Upload**: `SHA-256(upload_paths_joined_by_pipe + declaration_text + createdAtIso)`
*   **Signup Placeholder**: `SHA-256("signup" + createdAtIso)`

### 4. Declaration-to-Verified-Proof Upgrade Mechanic
To support founders who log declarations and upload proofs later:
*   An entry in a mutable tier (`declaration_pending` or `upload_unverified`) can be upgraded to a validated status (`declaration_validated` or `submission_validated`).
*   **Preserving Ledger History**: Instead of updating the original row (which would violate append-only constraints), the upgrade operation **inserts a new row** with `upgraded_from_id` pointing to the original entry's ID.
*   **Key Upgrade Constraints**:
    *   The original entry must belong to the authenticated user.
    *   The upgrade must occur within a **30-day window** since the original entry's creation date.
    *   An entry can only be upgraded **once** (prevented by a unique database constraint on `upgraded_from_id`).
    *   The upgraded entry shares the **same `day_number`** as the original entry, so it merges correctly in the grid interface.
    *   Upgrading does **not** increment the user's `execution_count` or alter their `last_submission_date`.

---

## Technical Details & Code Paths

### API Endpoints
*   **[/api/entries/first](file:///d:/oxe-cute/src/app/api/entries/first/route.ts)**: Handles onboarding Screen 08 submissions. Writes the initial Day 1 record, updates referral tables, triggers welcome emails, and logs analytics events.
*   **[/api/entries](file:///d:/oxe-cute/src/app/api/entries/route.ts)**: Handles normal operations.
    *   `GET`: Retrieves all entries sorted by `entry_number`, merges them with `break_days` and returns them to populate the execution grid.
    *   `POST`: Validates and writes standard daily entries or processes declaration upgrades.

### URL Validation
Before accepting a verified proof URL, the server calls `validateProofUrl(url)` in `src/lib/url-validation.ts`. This utility:
*   Ensures the URL is syntactically valid and uses the `https` protocol.
*   Ensures the URL does not match any other URL submitted by this user (no duplicate links).
*   Executes a server-side fetch to check that the site returns a successful HTTP status code (2xx) and extracts metadata like `content-type` and body size.

### File Attachment Validation
For declarations and unverified uploads, files are uploaded directly to the Supabase `entry-uploads` storage bucket.
*   The server invokes `assertValidUploadPathsForUser` to check that the file paths are valid string formats, do not exceed maximum size limitations (10MB), and belong strictly to the authenticated user's private storage path (`entry-uploads/user_id/...`).
