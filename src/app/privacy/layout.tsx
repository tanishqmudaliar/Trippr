import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Trippr safeguards your privacy with an offline-first architecture, local device storage, and transparent data practices.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Trippr",
    description:
      "Learn how Trippr safeguards your privacy with an offline-first architecture, local device storage, and transparent data practices.",
    url: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
