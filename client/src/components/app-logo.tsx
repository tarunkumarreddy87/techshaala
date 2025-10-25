import { GraduationCap } from "lucide-react";

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
        <GraduationCap className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold text-gray-900 dark:text-white">Techshaala</span>
    </div>
  );
}