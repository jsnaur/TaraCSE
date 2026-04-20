import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Terms of Service
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Terms of Service</h1>
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
            Welcome to TaraCSE. By accessing or using our services, you agree to the following terms and conditions.
          </p>
          <h2>Use of Service</h2>
          <p>
            You may use this platform for personal exam preparation only. You agree not to misuse the service or attempt to access content or accounts without authorization.
          </p>
          <h2>Account Responsibilities</h2>
          <p>
            Keep your login credentials secure. You are responsible for all activity that occurs under your account.
          </p>
          <h2>Content</h2>
          <p>
            All content is provided for educational purposes. We strive for accuracy, but we do not guarantee exam results.
          </p>
          <h2>Limitations of Liability</h2>
          <p>
            TaraCSE is not liable for direct or indirect damages arising from use of the service.
          </p>
          <h2>Changes</h2>
          <p>
            We may update these terms at any time. Continued use of the service after changes constitutes acceptance.
          </p>
        </div>
      </div>
    </main>
  );
}
