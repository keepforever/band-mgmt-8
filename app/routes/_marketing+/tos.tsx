export default function TermsOfServiceRoute() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-foreground">
      <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-4">
        Welcome to the <strong>Band Management Application</strong>. This application is currently in a development
        stage and is intended for casual use and experimentation. Please read the following terms of service carefully
        before using the application.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">1. Acceptance of Terms</h2>
      <p className="mb-4">
        By accessing or using this application, you agree to be bound by these terms of service. If you do not agree to
        these terms, please do not use the application.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">2. Temporary Nature of Service</h2>
      <p className="mb-4">
        This application is a demo and may be reset or removed at any time. Data entered into the application may be
        deleted without notice. We recommend not entering any sensitive or important data into the application.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">3. User Conduct</h2>
      <p className="mb-4">
        Users are expected to use the application responsibly and to refrain from any activity that could harm the
        application or other users. Any misuse of the application may result in termination of access.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">4. Disclaimer of Warranties</h2>
      <p className="mb-4">
        The application is provided "as is" and "as available" without warranties of any kind, either express or
        implied. We do not warrant that the application will be uninterrupted or error-free.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">5. Limitation of Liability</h2>
      <p className="mb-4">
        We shall not be liable for any damages resulting from the use or inability to use the application, including but
        not limited to data loss, errors, or interruptions in service.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">6. Changes to Terms</h2>
      <p className="mb-4">
        We reserve the right to modify these terms of service at any time. Changes will be posted on this page, and your
        continued use of the application constitutes acceptance of the new terms.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">7. Contact</h2>
      <p className="mb-4">If you have any questions about these terms of service, please contact us at:</p>

      <div className="mx-auto mt-8 rounded-md bg-destructive p-3 text-center text-destructive-foreground">
        <p className="text-body-sm">
          You can DM me on{' '}
          <a
            href="https://x.com/KeepForeverr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            X
          </a>{' '}
          or{' '}
          <a
            href="https://www.linkedin.com/in/brian-cilenti-65754749"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            LinkedIn
          </a>
        </p>
      </div>
    </div>
  )
}
