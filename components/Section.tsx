export default function Section({
  id,
  title,
  intro,
  children,
  as: H = 'h2',
}: {
  id: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
  as?: 'h1' | 'h2';
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto mt-16 max-w-site px-4 sm:mt-20">
      <H id={`${id}-title`} className="disp text-[48px] font-extrabold leading-tight">
        {title}
      </H>
      {intro && <div className="prose-site mt-3 text-[15px] text-fg/80">{intro}</div>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
