import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BrunaShop2 - Login Admin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AdminShop",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
