import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { UnsubscribePage_ } from "../components/UnsubscribePage";

export function UnsubscribePageStory() {
  return (
    <Tabs defaultValue="success" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="success">Success</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
      </TabsList>

      <TabsContent value="loading">
        <UnsubscribePage_ status="loading" />
      </TabsContent>

      <TabsContent value="success">
        <UnsubscribePage_ status="success" />
      </TabsContent>

      <TabsContent value="error">
        <UnsubscribePage_ status="error" errorMessage="Invalid unsubscribe link" />
      </TabsContent>
    </Tabs>
  );
}