import type { Metadata } from "next";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from "@mantine/core";
import { AuthProvider } from "@/context/authContext";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "Link Shortener",
  description: "A simple link shortener.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <Notifications />
          <AuthProvider>
              {children}
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
