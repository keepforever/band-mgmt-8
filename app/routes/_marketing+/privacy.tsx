export default function PrivacyRoute() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-foreground">
      <h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-4">
        Welcome to our demo application. This Privacy Policy explains how we collect, use, and share your information
        while using this application. Please read this policy carefully.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">1. Information Collection</h2>
      <p className="mb-4">
        This application may collect basic information that you provide directly, such as your username and any data you
        enter into the application. No sensitive personal information should be entered into this demo application.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">2. Use of Information</h2>
      <p className="mb-4">
        The information collected is used solely for the purpose of demonstrating the application's functionality. We do
        not use this information for any other purposes.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">3. Data Retention</h2>
      <p className="mb-4">
        Data entered into this application may be reset or deleted at any time as part of the demo process. We do not
        guarantee the retention of any data entered into the application.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">4. Sharing of Information</h2>
      <p className="mb-4">
        We do not share your information with third parties. The data entered into this demo application is not used for
        any purpose other than demonstrating the application's features.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">5. Security</h2>
      <p className="mb-4">
        We take reasonable measures to protect the information entered into this application. However, since this is a
        demo application, we cannot guarantee the security of any information you provide.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">6. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. Any changes will be posted on this page, and your continued
        use of the application constitutes acceptance of the updated policy.
      </p>
      <h2 className="mb-2 text-2xl font-semibold">7. Contact</h2>
      <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at:</p>
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
