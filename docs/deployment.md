# Deployment and recovery

This guide describes setup and recovery, not proof that a particular operation has completed. See [current release status](../plan.md) and its linked history for recorded production evidence. Production already exists; use the setup steps below for a new environment or an approved configuration change, not to recreate existing resources. Do not upload `data/`, `backups/`, `materials/`, or environment files to a repository or deployment. Review every file before publishing a remote repository. `.gitignore`, `.vercelignore`, Next tracing exclusions, and the build check are complementary safeguards; inspect the upload and build output before release. The service-role key belongs only in server-side secrets and must never use a `NEXT_PUBLIC_` name.

## Production setup

1. Use the owner-approved source repository and a separate Supabase project. Apply the migrations in `supabase/migrations/` in order. Do not run destructive SQL against existing progress.
2. Enable Google in Supabase Auth. Register the exact Supabase-provided Google callback URI in Google Cloud. In Supabase URL Configuration set the site URL to the stable HTTPS Vercel production origin and add exactly `https://YOUR-PRODUCTION-ORIGIN/auth/callback` to allowed redirect URLs. See [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) and [redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls). Google OAuth consent and approved account restrictions must be configured appropriately for the owner. The application redirects using `MATHS_APP_URL`, so use its stable production origin, not a temporary deployment URL; alternate origins cannot safely submit forms.
3. Add only the owner's verified Google email, lowercased, to `allowed_parent_emails`. Never share a service-role key in a browser or commit it.
4. In Vercel Production environment variables set `MATHS_MODE=hosted`, `MATHS_APP_URL=https://YOUR-PRODUCTION-ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the owner-approved public `MATHS_CONTACT_EMAIL`. Deploy the Next.js application with its default build command (`npm run build`). Vercel Preview intentionally disables authenticated/data access, including if production credentials are accidentally present. Do not configure production secrets for Preview. Public pages may still render; preview is not an authenticated testing environment.
5. Before publishing, verify upload exclusions and successful build, then verify HTTPS, approved Google login, denied unapproved login, profile ownership, cross-device resume, failed-save behavior and unchanged history. Create the owner child profile before importing progress. See below. Record evidence separately; no local build proves a live release.

Vercel Hobby is for personal, non-commercial use. Supabase Free can pause projects after inactivity; no always-on availability is promised. Checked 2026-11-03 against [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [Supabase free-project pausing](https://supabase.com/docs/guides/platform/free-project-pausing). Check current provider limits before deployment. Keep a private backup outside both services.

## Back up and transfer progress

Stop local writes while copying the local history, preserve the original and protect the backup directory. For example, with a private directory already created with owner-only permissions:

```sh
cp -p data/kids/course-v2.json /private/backup/course-v2-before-import.json
shasum -a 256 data/kids/course-v2.json /private/backup/course-v2-before-import.json
```

Confirm matching hashes and retain the backup. Copy the local history to the intended owner child only after authenticating and creating that profile. Obtain the exact parent and child UUIDs from the Supabase tables. Put the project URL and service-role key in a private `.env.local` file with owner-only permissions; do not include it in Git or upload it. The guarded import rejects existing progress and verifies the imported record:

```sh
npm run progress:import -- --parent-id PARENT_UUID --child-id CHILD_UUID --file /private/backup/course-v2-before-import.json
```

The original remains untouched. Verify the course and existing evidence in the app on a second device. Legacy short-session files are retained locally; this import transfers the course record only.

## Export and restore

Run the server-only export on a trusted computer with `.env.local` containing the target project's Supabase URL and service-role key. Supply an unused path in a private directory. The file is created with owner-only permissions and the command refuses to overwrite it. Default competition is the existing course; use `--competition ID` for another published course when supported.

```sh
node --env-file=.env.local --import tsx scripts/export-progress.ts --parent-id PARENT_UUID --child-id CHILD_UUID --file /private/backup/course-export.json
shasum -a 256 /private/backup/course-export.json
```

Save the hash and store the encrypted backup securely, separately from the application and cloud account. The export contains private child progress; it does not include authentication users, profiles, allowlist, or legacy local short sessions. Record parent and child UUIDs and competition ID separately and privately. Test recovery on a separate project and a copy of the backup, not production.

Restore the course using `npm run progress:import -- --parent-id PARENT_UUID --child-id CHILD_UUID --file /private/backup/course-export.json` with the appropriate target project's `.env.local` and profile. The importer only inserts where no progress exists; it will not replace a current record. For an existing target record, stop and assess recovery separately rather than deleting or overwriting progress. Recreate or map authentication and child profiles through the normal approved setup before restoring to an empty target. Verify the result against the preserved backup and its hash.

## Rollback

Roll back the Vercel deployment to a previously verified version through the Vercel dashboard. This does not roll back Supabase data or migrations. Check schema compatibility and preserve a fresh private export first. If database recovery would overwrite progress, stop and assess a separate, tested recovery procedure before touching the live record.

## Pilot operations

Invitation requests appear only in the private `invitation_requests` table. Review them manually; submitting a request never adds an email to `allowed_parent_emails`. Initially approve only the owner's family. Approve another parent's verified Google email only after the owner authorizes that family and a child place is available. Do not send invitations or promise a place automatically. The database serializes profile creation and refuses a sixth active child, including simultaneous requests.

Parents select child profiles at `/profiles` and share the authorized child overview/calendar at `/progress` (`/parent` redirects there). The last-task action is read-only; quiet feedback opens a modal without discarding current work. Reports remain private in `problem_reports`. Optional child Google access and shared adult access reuse the existing child profile; apply their additive migrations before deploying dependent code. Shared adult access requires `202611070001_child_sharing.sql`; follow the [release and two-account checks](child-sharing.md#before-release). A child can be archived by an authorized operator setting that exact profile's `active` to false; preserve the profile and course instead of deleting history. Archived children cannot be selected or mutated through the app. Reactivation also respects the five-child cap.

Requests above the available capacity stay in the waiting list. To revoke access, remove the exact parent email from the allowlist; no data deletion is implied. Handle email correction or deletion requests manually after verifying the requesting parent. Publish the real owner contact before inviting public testers.

## Public image assets

`npm run build` generates lossless, content-hashed images from unchanged PNG sources in `assets/images/`. Local development also runs this step. Commit the sources, `src/generated/public-images.json` and generated `public/assets/images/` files together. Original source PNGs are excluded from deployment traces; source PDFs remain private in `materials/`. Old PNG URLs redirect to the current optimized file. Hashed images use a one-year immutable cache; lesson SVGs revalidate on each use. Personalized pages, auth and APIs retain `no-store`.


## Public SEO and domain rollout

See [SEO/GEO strategy](../seo-geo.md) for content and commercial scope. Public metadata and sitemap use `MATHS_APP_URL` at build time; set it to the stable canonical HTTPS origin before building. Production public routes are an explicit allowlist; private responses remain no-store/noindex. Preview/local are noindex, with an empty sitemap. Their robots allow page crawling so bots can read noindex; API/auth paths stay disallowed. Noindex is not access control. Do not reuse a production-built artifact as an indexable preview without the proxy noindex header.

When an approved domain is purchased, connect it in Vercel, redirect old/alternate origins permanently with paths preserved, update Supabase Site URL and exact callback allowlist, and review Google OAuth settings. Verify successful/denied login, existing profiles/history and cross-device resume as well as public canonical URLs. Submit sitemap after DNS ownership verification in Search Console and Bing. Check actual response headers, HTML metadata, robots, sitemap and absence of public Set-Cookie after deployment; a build does not prove CDN behavior or indexing. No purchase or deployment is implied by these instructions.

For Search Console on the current Vercel address, create a URL-prefix property, choose HTML tag verification and set only its content value in `MATHS_GOOGLE_SITE_VERIFICATION` before a production build. Verify that the anonymous home response includes the expected `google-site-verification` tag, then click Verify in Search Console. Keep the value configured for subsequent builds. The optional tag is omitted on preview/local builds. For an owned domain, prefer DNS Domain-property verification. Follow the measurement checklist in [seo-geo.md](../seo-geo.md).
