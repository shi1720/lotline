/* eslint-disable @next/next/no-html-link-for-pages -- Shared with the standalone Firebase client. */
export const metadata = { title: "Privacy & data handling | Lotline" };
export default function Privacy() {
  return (
    <main className="policy-page">
      <a className="brand" href="/" aria-label="Lotline workspace">
        lotline.
      </a>
      <span className="eyebrow">PRIVACY & DATA HANDLING · 20 OCTOBER 2026</span>
      <h1>
        Your records.
        <br />A clear account of their care.
      </h1>
      <p>
        Lotline helps food businesses trace ingredient lots through production
        and shipments. This page explains the information this deployment uses
        and the controls available to you.
      </p>
      <h2>What you choose to save</h2>
      <p>
        Saved workspaces include the workspace name, imported business records,
        original CSV row values, source filenames and row numbers, and your
        Firebase account identifier. Records can contain supplier names and
        customer business contact details. Rehearsals preserve a snapshot of the
        records, trace results, reviewer notes, and time. Workspace activity
        includes saved changes and any correction notes you provide.
      </p>
      <h2>Try the sample without an account</h2>
      <p>
        The sample uses fictional businesses and synthetic records. Imports and
        edits remain in memory in the current browser page until you sign in and
        save. Refreshing or closing the page can discard unsaved work. Download
        a workspace backup to keep a copy. The synthetic sample is publicly
        accessible; your saved workspaces require your account.
      </p>
      <h2>Your account</h2>
      <p>
        Firebase Authentication handles email and password sign-in, password
        resets, and session persistence. Lotline uses your name, email, and
        Firebase account identifier to display your account and restrict access
        to saved records. Passwords are handled by Firebase Authentication. Your
        browser keeps the session information needed to keep you signed in.
        Signing out clears the current workspace from the screen and returns to
        the synthetic sample.
      </p>
      <h2>Column mapping and trace calculations</h2>
      <p>
        This deployment uses rule-based column suggestions and deterministic
        trace calculations. It does not send records to an AI model. Matching
        columns does not change imported source values. When you are signed in
        and request mapping suggestions, column headers and up to three sample
        rows are processed by the application server. Review every mapping
        before importing.
      </p>
      <h2>Storage and processing</h2>
      <p>
        Firebase Hosting serves the application. Firestore stores workspace data
        in the Montreal region. The application server processes requests on
        Google Cloud Run in the us-central1 region in the United States.
        Firebase Authentication is a global service. This application does not
        offer Canadian-only processing. Google infrastructure may process
        operational and security logs under its service policies. The interface
        loads fonts from Google Fonts; those font requests do not include
        workspace records.
      </p>
      <h2>Exports and deletion</h2>
      <p>
        You can download workspace backups, trace reports, source evidence, and
        saved rehearsal snapshots. Deleting a workspace removes its records,
        saved rehearsals, and workspace activity from the application database.
        Copies and downloads you keep remain under your control. Deleting a
        workspace does not delete your Firebase account. Provider backups and
        infrastructure logs are subject to Google&apos;s retention policies;
        this application does not promise immediate removal from those systems.
      </p>
      <h2>What belongs in a workspace</h2>
      <p>
        Upload business records you are authorized to use. Limit contact details
        to those needed for your business trace. Keep consumer personal
        information, health information, passwords, and payment details out of
        imported files. Check your organization&apos;s data requirements before
        saving confidential records.
      </p>
      <h2>Responsible use</h2>
      <p>
        Lotline follows the records you supply. Your responsible team must
        verify completeness, resolve missing links, and decide what action to
        take. Calculated balances are not a physical stock count. The
        application does not send messages to customers, determine food safety,
        or certify legal compliance.
      </p>
      <h2>Questions and security reports</h2>
      <p>
        For general product questions, use the{" "}
        <a
          href="https://github.com/shi1720/lotline/issues"
          target="_blank"
          rel="noreferrer"
        >
          project issue tracker
        </a>
        . Do not post private records, passwords, or credentials in a public
        issue. For security concerns, follow the instructions in the
        repository&apos;s{" "}
        <a
          href="https://github.com/shi1720/lotline/blob/main/SECURITY.md"
          target="_blank"
          rel="noreferrer"
        >
          security policy
        </a>
        .
      </p>
      <a className="btn dark" href="/">
        Return to the workspace
      </a>
    </main>
  );
}
