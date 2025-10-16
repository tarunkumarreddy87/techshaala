import { GraduationCap } from "lucide-react";

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none">Advanced Hackathon</span>
        <span className="text-xs text-muted-foreground leading-none mt-0.5">LMS</span>
      </div>
    </div>
  );
}
