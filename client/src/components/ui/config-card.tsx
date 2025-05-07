import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReactNode } from "react";

interface ConfigCardProps {
  title: string;
  description?: string;
  titleRight?: ReactNode;
  children: ReactNode;
}

export function ConfigCard({ title, description, titleRight, children }: ConfigCardProps) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-heading font-semibold text-slate-800">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm text-slate-600 mt-1">
                {description}
              </CardDescription>
            )}
          </div>
          {titleRight && (
            <div>
              {titleRight}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
