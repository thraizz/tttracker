import { cn } from "@/lib/utils";

interface MMRDisplayProps {
    mmr: number;
    peakMmr: number;
    size?: "sm" | "md" | "lg";
    showPeak?: boolean;
    className?: string;
}

export const MMRDisplay = ({
    mmr,
    peakMmr,
    size = "lg",
    showPeak = true,
    className
}: MMRDisplayProps) => {
    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl"
    };

    const peakSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-xs"
    };

    return (
        <div className={cn("text-right space-y-1", className)}>
            {/* Main MMR Display */}
            <div className="relative inline-block">
                {/* Subtle background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-lg blur-[2px]" />

                {/* Main MMR number */}
                <div className="relative px-3 py-1.5 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/30 dark:to-green-950/20 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                    <div
                        className={cn(
                            "font-bold tracking-tight text-emerald-700 dark:text-emerald-300",
                            sizeClasses[size]
                        )}
                    >
                        {mmr.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* MMR Label */}
            <div className="text-sm text-muted-foreground font-medium">
                MMR
            </div>

            {/* Peak MMR */}
            {showPeak && (
                <div className={cn("text-muted-foreground", peakSizeClasses[size])}>
                    <span className="opacity-60">Peak:</span>{" "}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {peakMmr.toLocaleString()}
                    </span>
                </div>
            )}
        </div>
    );
};
