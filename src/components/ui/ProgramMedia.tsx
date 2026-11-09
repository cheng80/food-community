export function ProgramMedia({ mobile, desktop, alt }: { mobile: string; desktop?: string; alt: string }) {
  return (
    <picture>
      {desktop && <source media="(min-width: 768px)" srcSet={desktop} width={2480} height={806} />}
      <img src={mobile} alt={alt} width={720} height={360} className="block h-auto w-full md:rounded-xl" />
    </picture>
  );
}
