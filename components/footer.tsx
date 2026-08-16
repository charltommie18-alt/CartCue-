import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-4 text-xs text-neutral-500">
        <span>© {new Date().getFullYear()} CartCue</span>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <Link href="/disclosure" className="hover:underline">
          Affiliate Disclosure
        </Link>
        <Link href="/delete-data" className="hover:underline">
          Data Deletion
        </Link>
      </div>
    </footer>
  );
}
