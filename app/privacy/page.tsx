import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Privacy Policy
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Back to home
          </Link>
        </div>

        <div className="prose prose-invert max-w-none text-sm sm:text-base">
          <p>
            Your privacy matters to us. This page explains how we collect, use, and protect your information.
          </p>
          <h2>Information We Collect</h2>
          <p>
            We collect only what is necessary to create your account and improve your experience, including email address and preferences.
          </p>
          <h2>How We Use Information</h2>
          <p>
            We use your information to operate the service, send important account notices, and improve content.
          </p>
          <h2>Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share information only when required by law or to provide the service.
          </p>
          <h2>Security</h2>
          <p>
            We implement reasonable measures to protect your data, but no system is completely secure.
          </p>
          <h2>Updates</h2>
          <p>
            We may update this policy and will post changes here. Continued use of the service means you accept updates.
          </p>
        </div>
      </div>
    </main>
  );
}
