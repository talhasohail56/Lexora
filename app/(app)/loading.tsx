import { Shimmer } from "@/components/animated/shimmer";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Shimmer className="h-9 w-72" />
        <Shimmer className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-5 shadow-soft">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="mt-5 h-8 w-24" />
            <Shimmer className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-soft">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="mx-auto mt-6 h-44 w-44 rounded-full" />
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-soft lg:col-span-2">
          <Shimmer className="h-4 w-32" />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Shimmer key={index} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
