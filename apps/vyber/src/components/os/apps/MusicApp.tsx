import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const MusicPlayer = lazy(() =>
  import("@/components/pages/MusicPlayer").then((m) => ({ default: m.MusicPlayer }))
);

/**
 * MusicApp - Vybe Player running as a windowed app in VybeOS
 */
export function MusicApp() {
  return (
    <div className="h-full bg-background">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
          </div>
        }
      >
        <MusicPlayer />
      </Suspense>
    </div>
  );
}
