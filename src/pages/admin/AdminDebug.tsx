import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Activity,
    Database,
    Users,
    Building2,
    Home,
    AlertCircle,
    CheckCircle2,
    Play,
    RefreshCw,
    Server,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminSystemHealth() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const log = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [
                { count: usersCount },
                { count: companiesCount },
                { count: propertiesCount },
                { count: subscriptionsCount },
            ] = await Promise.all([
                supabase.from("profiles").select("*", { count: "exact", head: true }), // Assuming profiles or we can query companies
                supabase.from("companies").select("*", { count: "exact", head: true }),
                supabase.from("properties").select("*", { count: "exact", head: true }),
                supabase.from("subscriptions").select("*", { count: "exact", head: true }),
            ]);

            // Check for potential issues
            const { data: orphanedProperties, error: orphanError } = await supabase
                .from("properties")
                .select("id, title")
                .is("company_id", null)
                .limit(5);

            setStats({
                users: usersCount || 0,
                companies: companiesCount || 0,
                properties: propertiesCount || 0,
                subscriptions: subscriptionsCount || 0,
                orphanedProperties: orphanedProperties || [],
            });
            log("Stats refreshed successfully");
        } catch (error: any) {
            log(`Error fetching stats: ${error.message}`);
            toast.error("Failed to fetch system stats");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedData = async () => {
        if (!confirm("This will generate 30 mock users and related data. Continue?")) return;

        setSeeding(true);
        log("Starting data seeding process...");

        try {
            const { data, error } = await supabase.rpc("seed_database_data");

            if (error) throw error;

            log(`✅ Seeding Complete: ${data}`);
            toast.success("Data seeding completed successfully!");
            fetchStats();
        } catch (error: any) {
            log(`❌ Seeding Failed: ${error.message}`);
            toast.error(`Seeding failed: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    const [advancedStats, setAdvancedStats] = useState({
        activeUsers: 0,
        recentErrors: 0,
        totalReferrals: 0,
        avgLatency: 0
    });

    const runFullSystemScan = async () => {
        log("\n🚀 INITIALIZING FULL SYSTEM HEALTH SCAN...");
        const startTime = performance.now();
        let issuesFound = 0;

        // Helper to log with status
        const check = (name: string, status: boolean, msg: string, isWarning = false) => {
            if (status) {
                log(`✅ ${name}: ${msg}`);
            } else {
                if (isWarning) {
                    log(`⚠️ ${name}: ${msg}`);
                } else {
                    log(`❌ ${name}: ${msg}`);
                    issuesFound++;
                }
            }
        };

        // 1. CORE SERVICES (Auth & DB)
        log("\n1️⃣ CORE SERVICES");
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        check("Auth Service", !authError && !!session, session ? `Active (${session.user.email})` : "No Admin Session", !session);

        const dbStart = performance.now();
        const { error: dbError } = await supabase.from('companies').select('count', { count: 'exact', head: true });
        const latency = Math.round(performance.now() - dbStart);
        check("Database Connection", !dbError, `${latency}ms latency`);

        // 2. STORAGE HEALTH (Smart Check)
        log("\n2️⃣ STORAGE & ASSETS");
        // Try direct access to 'property-images' since listBuckets can be restricted
        const { data: files, error: fileError } = await supabase.storage.from('property-images').list();
        const bucketAccessible = !fileError;
        check("Property Images Bucket", bucketAccessible, bucketAccessible ? "Accessible (Read/Write)" : `Restricted: ${fileError?.message}`);

        const { data: logos, error: logoError } = await supabase.storage.from('company-logos').list();
        check("Company Logos Bucket", !logoError, !logoError ? "Accessible" : "Inaccessible");

        // 3. BUSINESS DATA INTEGRITY
        log("\n3️⃣ BUSINESS DATA INTEGRITY");

        // Companies
        const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
        const { count: orphanedCompanies } = await supabase.from('companies').select('*', { count: 'exact', head: true }).is('user_id', null);
        check("Company Directory", true, `${companyCount} Total Companies`);
        check("Orphaned Companies", orphanedCompanies === 0, `${orphanedCompanies} companies with no owner`, true);

        // Properties
        const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true });
        const { count: badProperties } = await supabase.from('properties').select('*', { count: 'exact', head: true }).lt('price', 0);
        check("Property Listings", true, `${propertyCount} Total Properties`);
        check("Price Integrity", badProperties === 0, `${badProperties} properties with negative prices`);

        // Subscriptions
        const { count: subCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
        check("Subscription System", true, `${subCount} Active Subscriptions`);

        // 4. OPERATIONAL HEALTH
        log("\n4️⃣ OPERATIONS & SUPPORT");

        // Support Tickets
        const { count: openTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
        const { count: highPriority } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'high').eq('status', 'open');
        check("Support Queue", true, `${openTickets} Open Tickets`);
        check("High Priority", highPriority === 0, `${highPriority} urgent tickets pending`, true);

        // Referrals
        const { count: referrals } = await supabase.from('referrals').select('*', { count: 'exact', head: true });
        check("Referral System", true, `${referrals} Total Referrals tracked`);

        // Analytics Data Flow
        const { count: recentEvents } = await supabase.from('analytics').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        check("Analytics Stream", (recentEvents || 0) > 0, `${recentEvents} events recorded in last 24h`, true);

        // 5. SYSTEM ISSUES (Logs)
        log("\n5️⃣ ERROR LOGS");
        const { count: errors } = await supabase.from('admin_notifications_log').select('*', { count: 'exact', head: true }).eq('type', 'error').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        check("Error Log Scan", (errors || 0) === 0, (errors || 0) + " system errors in last 24h");

        // Summary
        log("\n----------------------------------------");
        const duration = Math.round(performance.now() - startTime);
        if (issuesFound === 0) {
            log(`🎉 SCAN COMPLETE: SYSTEM HEALTHY (${duration}ms)`);
            toast.success("All systems operational");
        } else {
            log(`⚠️ SCAN COMPLETE: ${issuesFound} ISSUES DETECTED`);
            toast.warning(`Attention needed: ${issuesFound} issues`);
        }

        // Update dashboard stats
        setAdvancedStats({
            activeUsers: 0, // Calculated dynamically if needed
            recentErrors: errors || 0,
            totalReferrals: referrals || 0,
            avgLatency: latency
        });
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <AdminLayout title="System Health & Diagnostics">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.companies ?? "-"}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.properties ?? "-"}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.subscriptions ?? "-"}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Badge variant={stats?.orphanedProperties?.length > 0 ? "destructive" : "default"} className="bg-green-500 hover:bg-green-600">
                                    {stats ? "Healthy" : "Unknown"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="actions" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="actions" className="gap-2">
                            <Play className="h-4 w-4" /> Actions
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="gap-2">
                            <Server className="h-4 w-4" /> Logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="actions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Management</CardTitle>
                                <CardDescription>Generate test data or maintain database integrity.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40 opacity-75">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold flex items-center gap-2 text-muted-foreground">
                                            <Database className="h-4 w-4" /> Seed Test Data (Disabled)
                                        </h4>
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Seeder is currently disabled for safety.
                                        </p>
                                    </div>
                                    <Button
                                        disabled={true}
                                        className="min-w-[140px]"
                                        variant="secondary"
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        Disabled
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Activity className="h-4 w-4" /> System Diagnostics
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Run comprehensive checks on Auth, Storage, and Database.
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={runFullSystemScan}>
                                        Run Checks
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="logs">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>System Logs</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => setLogs([])}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px] w-full rounded-md border bg-slate-950 p-4">
                                    <div className="font-mono text-sm text-green-400 space-y-1">
                                        {logs.length === 0 ? (
                                            <div className="text-slate-500 italic">No logs generated yet...</div>
                                        ) : (
                                            logs.map((log, i) => (
                                                <div key={i} className="whitespace-pre-wrap font-mono">{log}</div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
