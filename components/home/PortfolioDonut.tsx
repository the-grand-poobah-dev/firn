export function PortfolioDonut() {
  const count = 88;
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const segment = circumference / count;
  const colors = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)','var(--c8)'];
  return <div className="relative mx-auto size-52">
    <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label="88 equal property allocation segments">
      {Array.from({ length: count }, (_, index) => {
        const length = Math.max(0.4, segment - 1.25);
        return <circle key={index} cx="50" cy="50" r={radius} fill="none" stroke={colors[index % colors.length]} strokeWidth="7"
          strokeDasharray={length + ' ' + (circumference - length)} strokeDashoffset={-index * segment}/>;
      })}
    </svg>
    <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-2xl font-semibold">10%</p><p className="mt-0.5 text-[10px] text-muted">each property</p></div></div>
  </div>;
}
