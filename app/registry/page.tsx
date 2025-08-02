"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Shield,
  TrendingUp,
  FileText,
  Activity,
  Plus,
  Eye,
} from "lucide-react";
import { useEntity } from "@/lib/entity-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocale, getLocaleOptions } from "@/lib/locale";

interface RegistrySummary {
  totalMembers: number;
  totalSecurities: number;
  totalTransactions: number;
  activeSecurities: number;
  archivedSecurities: number;
  recentTransactions: Array<{
    id: string;
    transactionType: string;
    quantity: number;
    settlementDate: string;
    status: string;
  }>;
}

export default function RegistryPage() {
  const { selectedEntity } = useEntity();
  const [summary, setSummary] = useState<RegistrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedEntity) {
      fetchRegistrySummary();
    } else {
      setSummary(null);
      setLoading(false);
    }
  }, [selectedEntity]);

  const fetchRegistrySummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/registry/summary?entityId=${selectedEntity?.id}`,
      );
      const result = await response.json();

      if (result.success) {
        setSummary(result.data.summary);
      } else {
        console.error("Failed to fetch registry summary:", result.error);
      }
    } catch (error) {
      console.error("Error fetching registry summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedEntity) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              No Entity Selected
            </h2>
            <p className="text-muted-foreground mb-6">
              Please select an entity from the dropdown in the navigation bar to
              view registry information.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Registry Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage securities, members, and transactions for{" "}
            {selectedEntity.name}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : summary?.totalMembers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Security Classes
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : summary?.activeSecurities || 0}
              </div>
              {summary && summary.archivedSecurities > 0 && (
                <p className="text-xs text-muted-foreground">
                  {summary.archivedSecurities} archived
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : summary?.totalTransactions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Registry Status
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="securities">Securities</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="events">Event Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>Latest registry activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : summary?.recentTransactions &&
                    summary.recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {summary.recentTransactions
                        .slice(0, 5)
                        .map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <div className="font-medium capitalize">
                                {transaction.transactionType.toLowerCase()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(
                                  transaction.settlementDate,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {transaction.quantity.toLocaleString(
                                  getLocale(),
                                  getLocaleOptions(),
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {transaction.status.toLowerCase()}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent transactions
                    </div>
                  )}
                  <div className="mt-4">
                    <Link href="/registry/transactions">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Transactions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common registry operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/registry/securities">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Securities
                    </Button>
                  </Link>

                  <Link href="/registry/members">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Members
                    </Button>
                  </Link>

                  <Link href="/registry/transactions/new">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Create Transaction
                    </Button>
                  </Link>

                  <Link href="/events">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      View Event Log
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="securities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Securities Management
                    </CardTitle>
                    <CardDescription>
                      Manage security classes and instruments
                    </CardDescription>
                  </div>
                  <Link href="/registry/securities">
                    <Button>
                      <Eye className="mr-2 h-4 w-4" />
                      View All Securities
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    Click &quot;View All Securities&quot; to manage security
                    classes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Members Management
                    </CardTitle>
                    <CardDescription>
                      Manage shareholders and option holders
                    </CardDescription>
                  </div>
                  <Link href="/registry/members">
                    <Button>
                      <Eye className="mr-2 h-4 w-4" />
                      View All Members
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    Click &quot;View All Members&quot; to manage registry
                    members
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Transactions
                    </CardTitle>
                    <CardDescription>
                      View and manage registry transactions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/registry/transactions">
                      <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View All
                      </Button>
                    </Link>
                    <Link href="/registry/transactions/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Transaction
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    Click &quot;View All&quot; to see transactions or &quot;New
                    Transaction&quot; to create one
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Event Log
                    </CardTitle>
                    <CardDescription>
                      Audit trail of all registry changes
                    </CardDescription>
                  </div>
                  <Link href="/events">
                    <Button>
                      <Eye className="mr-2 h-4 w-4" />
                      View Event Log
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    Click &quot;View Event Log&quot; to see the complete audit
                    trail
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
