import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

interface Variant {
  id: string;
  label: string;
}

interface StoryContainerProps {
  title: string;
  description?: string;
  variants: Variant[];
  activeVariant: string;
  onVariantChange: (variant: any) => void;
  debugInfo?: ReactNode;
  children: ReactNode;
}

export function StoryContainer({
  title,
  description,
  variants,
  activeVariant,
  onVariantChange,
  debugInfo,
  children,
}: StoryContainerProps) {
  return (
    <Card>
      <CardHeader>
        <div className="heard-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {debugInfo && (
            <Badge variant="outline" className="text-xs">
              {debugInfo}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeVariant} onValueChange={onVariantChange} className="w-full">
          <TabsList className="mb-6">
            {variants.map((variant) => (
              <TabsTrigger key={variant.id} value={variant.id}>
                {variant.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {variants.map((variant) => (
            <TabsContent key={variant.id} value={variant.id}>
              {children}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}