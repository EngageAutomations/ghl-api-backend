import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ConfigCard({ title, description, children, className }: ConfigCardProps) {
  return (
    <Card className={`shadow-md ${className || ""}`}>
      <CardHeader className="border-b border-gray-100 bg-gray-50/50">
        <CardTitle className="text-lg font-semibold text-slate-800">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-slate-500">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}