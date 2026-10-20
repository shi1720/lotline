import Link from "next/link";
export const metadata = { title: "Privacy & data handling — Lotline" };
export default function Privacy() {
  return (
    <main className="policy-page">
      <Link className="brand" href="/">
        lotline.
      </Link>
      <span className="eyebrow">PRIVACY & DATA HANDLING · 20 OCTOBER 2026</span>
      <h1>
        Your records stay
        <br />
        under your control.
      </h1>
      <p>
        Lotline is an evaluation product created by Shivam Gupta. This page
        explains the current build’s behavior so you can decide what to upload.
      </p>
      <h2>What this application stores</h2>
      <p>
        When you sign in and save a workspace, Lotline stores its name, imported
        business records, source filenames and row numbers, and a site-specific
        account identifier in Cloudflare D1. Records may include supplier names
        and customer business contact details. Saving a rehearsal also stores a
        snapshot of the records, calculated trace, reviewer notes, and time.
        Automatic activity entries record workspace changes.
      </p>
      <h2>The public sample</h2>
      <p>
        The default workspace contains fictional companies and synthetic
        records. Anonymous imports and edits stay in memory in the current
        browser page. They do not become saved server records until you sign in
        and save. Download a backup before leaving the page.
      </p>
      <h2>Signing in</h2>
      <p>
        ChatGPT provides sign-in and shares basic profile information with the
        application. Lotline uses the site-specific account identifier to
        restrict access to saved workspaces. It does not receive your chat
        history. A temporary browser session draft preserves unsaved records
        through sign-in. The application validates and removes that draft when
        it restores your work.
      </p>
      <h2>Optional AI mapping</h2>
      <p>
        The active deployment uses rule-based mapping and does not send records
        to Anthropic. If an operator configures the optional Claude adapter in a
        later deployment, clicking Suggest mapping sends the column headers and
        up to three sample rows to Anthropic. The import dialog explains this
        before the action. No model runs automatically, and model output cannot
        change record values.
      </p>
      <h2>Export, retention, and deletion</h2>
      <p>
        Saved records remain until you delete their workspace. Deleting a
        workspace removes its datasets, drill snapshots, and activity history
        from the application database. Downloads and copies you retain remain
        under your control. Platform backups, authentication records, and
        infrastructure logs follow the hosting providers’ policies. This build
        has no independently verified backup-retention guarantee.
      </p>
      <h2>Where data is processed</h2>
      <p>
        The application runs on Sites and Cloudflare infrastructure. This
        deployment does not guarantee Canadian-only storage or processing.
        Sign-in is handled by OpenAI. The interface downloads fonts from Google
        Fonts; no workspace records are included in those font requests. Check
        your organization’s requirements before uploading confidential records.
      </p>
      <h2>Practical limits</h2>
      <p>
        Use synthetic or approved evaluation records. Avoid consumer personal
        information, health information, passwords, or payment data. This build
        supports one ingredient-to-finished-batch transformation and does not
        replace incident procedures or qualified review. It has no payment
        collection, advertising tracker, or automated customer notification
        feature.
      </p>
      <h2>Contact and issues</h2>
      <p>
        For product questions, use the{" "}
        <a href="https://github.com/shi1720/lotline/issues">
          project issue tracker
        </a>
        . Do not post private records or credentials there. For a security
        concern, follow the repository’s SECURITY.md and keep sensitive details
        out of public issues.
      </p>
      <Link className="btn dark" href="/">
        Return to the workspace
      </Link>
    </main>
  );
}
