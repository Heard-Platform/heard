import { ReactNode, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

interface Variant {
  id: string;
  label: string;
  children: ReactNode;
}

interface StoryContainerProps {
  title: string;
  description?: string;
  variants: Variant[];
  debugInfo?: ReactNode;
}

export function StoryContainer({
  title,
  description,
  variants,
  debugInfo,
}: StoryContainerProps) {
  const [activeVariant, setActiveVariant] = useState(variants[0].id);
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
        {variants.length !== 1 ? (
        <Tabs value={activeVariant} onValueChange={setActiveVariant} className="w-full">
          <TabsList className="mb-6">
            {variants.map((variant) => (
              <TabsTrigger key={variant.id} value={variant.id}>
                {variant.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {variants.map((variant) => (
            <TabsContent key={variant.id} value={variant.id}>
              {variant.children}
            </TabsContent>
          ))}
        </Tabs>
        ) : (
          variants[0].children
        )}
      </CardContent>
    </Card>
  );
}