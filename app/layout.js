import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavLinks from "../components/NavLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AtlasForge — AI Research Navigator",
  description:
    "Turn research papers into structured, searchable knowledge with schema-guided AI.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf8f5] text-slate-800 antialiased">
        <header className="border-b border-slate-200 bg-white/90">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
            <div>
              <Link href="/" className="font-serif text-xl font-bold text-slate-900">
                AtlasForge
              </Link>
              <p className="hidden text-xs text-slate-500 sm:block">
                AI Research &amp; Knowledge Navigator
              </p>
            </div>
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-[#faf8f5] py-5 text-center text-xs text-slate-500">
          CSB312 Generative AI · CA3 Mini Project
        </footer>
      </body>
    </html>
  );
}
