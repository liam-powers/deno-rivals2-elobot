import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Rivals 2 Elo Bot",
    description: "Created by @liamhi on Discord",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
