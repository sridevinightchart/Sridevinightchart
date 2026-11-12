import PageHead from './PageHead';

export default function StaticPage({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <>
      <PageHead crumbs={[{ name: title, href }]} title={title} />
      <div className="prose-site mx-auto mt-6 max-w-site px-4 text-[15px] [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold">
        {children}
      </div>
    </>
  );
}
