import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[880px] px-6 py-20 text-center">
      <span className="disp text-[100px] font-black leading-none text-accent-text sm:text-[140px]">404</span>
      <h1 className="disp mt-5 text-[40px] font-extrabold sm:text-[56px]">This page is off the chart</h1>
      <p className="mx-auto mt-4 max-w-[48ch] text-lg leading-relaxed text-muted">We couldn’t find that page. Head back for the latest result and historical charts.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink">Back to Sridevi Night Chart</Link>
      <Link href="/contact/" className="mt-5 block text-sm font-semibold text-accent-text hover:underline">Report a broken link</Link>
    </div>
  );
}
