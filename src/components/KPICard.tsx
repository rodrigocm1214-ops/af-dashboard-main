import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function KPICard({ title, value, icon: Icon, trend = 'neutral', trendValue }: KPICardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border border-border bg-card hover:bg-surface transition-colors duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground tracking-tight truncate pr-2">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-xl sm:text-2xl font-semibold tracking-tight mb-1 break-all">
          {value}
        </div>
        {trendValue && (
          <p className={`text-xs font-medium ${getTrendColor()} truncate`} title={trendValue}>
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}