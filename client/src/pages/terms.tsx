import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/login">
              <Button variant="ghost" className="mb-4">
                ← Back to Login
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms and Conditions</h1>
            <p className="text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing or using the Techshaala Learning Management System ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Techshaala provides an online learning platform that connects students and teachers. The Service allows users to create and enroll in courses, submit assignments, participate in discussions, and access educational content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Users must be at least 13 years old to use the Service</li>
                <li>Users must provide accurate information during registration</li>
                <li>Users must not use the Service for any illegal or unauthorized purpose</li>
                <li>Users must not transmit any worms or viruses or any code of a destructive nature</li>
                <li>Users must respect the intellectual property rights of others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of Techshaala and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall Techshaala, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="mb-4">
                Email: support@techshaala.com<br />
                Address: 123 Education Street, Learning City, LC 12345
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}