import { Navigation } from "@/components/app-shell/navigation";

export function MobileNavigation() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0c0d11]/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
      <Navigation variant="mobile" />
    </div>
  );
}
