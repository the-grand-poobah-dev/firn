export default function HomeLoading() {
  return <div className="space-y-5" aria-label="Loading home">
    <div className="flex items-center gap-3"><div className="size-11 animate-pulse rounded-full bg-card2"/><div className="space-y-2"><div className="h-3 w-24 animate-pulse rounded bg-card2"/><div className="h-4 w-32 animate-pulse rounded bg-card2"/></div></div>
    <div className="h-64 animate-pulse rounded-[24px] bg-card2"/>
    <div className="h-5 w-32 animate-pulse rounded bg-card2"/>
    <div className="h-48 animate-pulse rounded-[24px] bg-card2"/>
  </div>;
}
