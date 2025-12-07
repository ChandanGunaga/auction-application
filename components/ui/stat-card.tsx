import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  gradient?: string;
}

export function StatCard({ title, value, icon, className, gradient }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {gradient && (
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: gradient }}
        />
      )}
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          {icon && (
            <div className="text-4xl opacity-80">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
