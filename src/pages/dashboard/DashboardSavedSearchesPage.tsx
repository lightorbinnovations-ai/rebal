import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedSearchesList } from "@/components/marketplace/SavedSearchesList";
import { Heart, Bell, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DashboardSavedSearchesPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Saved Searches
        </h1>
        <p className="text-muted-foreground">
          Manage your saved property searches and notification preferences
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Bell className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          When new properties match your saved search criteria, you'll receive a notification in your app. 
          Toggle notifications on or off for each search.
        </AlertDescription>
      </Alert>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            How Saved Searches Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Browse & Filter</p>
                <p className="text-xs text-muted-foreground">
                  Go to the public marketplace and apply your desired filters
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Save Your Search</p>
                <p className="text-xs text-muted-foreground">
                  Click "Save Search" to save your filter criteria
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Get Notified</p>
                <p className="text-xs text-muted-foreground">
                  Receive notifications when new matching properties are listed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Saved Searches</CardTitle>
          <CardDescription>
            Click "Apply" to view matching properties, or toggle notifications on/off
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SavedSearchesList />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSavedSearchesPage;
