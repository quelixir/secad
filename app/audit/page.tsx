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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, Filter, Activity, Copy, Eye } from "lucide-react";
import { useEntity } from "@/lib/entity-context";
import { useEffect, useState } from "react";
import {
  EventLog,
  EventLogResponse,
  AuditAction,
  AuditTableName,
} from "@/lib/audit";

export default function AuditPage() {
  const { selectedEntity } = useEntity();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    tableName: "all",
    recordId: "",
    action: "all",
  });

  useEffect(() => {
    if (selectedEntity) {
      fetchEventLogs();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [selectedEntity, offset, filters]);

  const fetchEventLogs = async () => {
    if (!selectedEntity) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        entityId: selectedEntity.id,
        limit: "50",
        offset: offset.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== "" && value !== "all",
          ),
        ),
      });

      const response = await fetch(`/api/audit?${params}`);
      const result = await response.json();

      if (result.success) {
        const data: EventLogResponse = result.data;
        setEvents(data.logs);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        console.error("Failed to fetch event logs:", result.error);
      }
    } catch (error) {
      console.error("Error fetching event logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedEntity) return;

    try {
      const params = new URLSearchParams({
        entityId: selectedEntity.id,
        export: "csv",
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== "" && value !== "all",
          ),
        ),
      });

      const response = await fetch(`/api/audit?${params}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${selectedEntity.id}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting event logs:", error);
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      userId: "",
      tableName: "all",
      recordId: "",
      action: "all",
    });
    setOffset(0);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getActionColor = (action: AuditAction): string => {
    switch (action) {
      case AuditAction.CREATE:
        return "bg-green-100 text-green-800";
      case AuditAction.UPDATE:
        return "bg-blue-100 text-blue-800";
      case AuditAction.DELETE:
        return "bg-red-100 text-red-800";
      case AuditAction.ARCHIVE:
        return "bg-yellow-100 text-yellow-800";
      case AuditAction.UNARCHIVE:
        return "bg-purple-100 text-purple-800";
      case AuditAction.CERTIFICATE_GENERATED:
        return "bg-indigo-100 text-indigo-800";
      case AuditAction.CERTIFICATE_DOWNLOADED:
        return "bg-blue-100 text-blue-800";
      case AuditAction.CERTIFICATE_ACCESSED:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTableNameLabel = (tableName: AuditTableName): string => {
    switch (tableName) {
      case AuditTableName.MEMBER:
        return "Member";
      case AuditTableName.SECURITY_CLASS:
        return "Security Class";
      case AuditTableName.TRANSACTION:
        return "Transaction";
      case AuditTableName.MEMBER_CONTACT:
        return "Member Contact";
      default:
        return tableName;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if you have a toast system
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleViewEvent = (event: EventLog) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  if (!selectedEntity) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No entity selected
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please select an entity to view audit events.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">
              View and export audit logs for {selectedEntity.name}
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={loading || events.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter audit events by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Filter by user ID"
                  value={filters.userId}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, userId: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select
                  value={filters.tableName}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, tableName: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    <SelectItem value={AuditTableName.MEMBER}>
                      Members
                    </SelectItem>
                    <SelectItem value={AuditTableName.SECURITY_CLASS}>
                      Security Classes
                    </SelectItem>
                    <SelectItem value={AuditTableName.TRANSACTION}>
                      Transactions
                    </SelectItem>
                    <SelectItem value={AuditTableName.MEMBER_CONTACT}>
                      Member Contacts
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Record ID</label>
                <Input
                  placeholder="Filter by record ID"
                  value={filters.recordId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      recordId: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, action: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value={AuditAction.CREATE}>Create</SelectItem>
                    <SelectItem value={AuditAction.UPDATE}>Update</SelectItem>
                    <SelectItem value={AuditAction.DELETE}>Delete</SelectItem>
                    <SelectItem value={AuditAction.ARCHIVE}>Archive</SelectItem>
                    <SelectItem value={AuditAction.UNARCHIVE}>
                      Unarchive
                    </SelectItem>
                    <SelectItem value={AuditAction.CERTIFICATE_GENERATED}>
                      Certificate Generated
                    </SelectItem>
                    <SelectItem value={AuditAction.CERTIFICATE_DOWNLOADED}>
                      Certificate Downloaded
                    </SelectItem>
                    <SelectItem value={AuditAction.CERTIFICATE_ACCESSED}>
                      Certificate Accessed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log ({total} total)</CardTitle>
            <CardDescription>Showing {events.length} events</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading events...
                  </p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No events found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px] text-xs">
                        Timestamp
                      </TableHead>
                      <TableHead className="w-[120px] text-xs">User</TableHead>
                      <TableHead className="w-[100px] text-xs">
                        Action
                      </TableHead>
                      <TableHead className="w-[100px] text-xs hidden lg:table-cell">
                        Table
                      </TableHead>
                      <TableHead className="w-[120px] text-xs hidden md:table-cell">
                        Record ID
                      </TableHead>
                      <TableHead className="w-[80px] text-xs hidden xl:table-cell">
                        Field
                      </TableHead>
                      <TableHead className="w-[120px] text-xs hidden lg:table-cell">
                        Changes
                      </TableHead>
                      <TableHead className="w-[60px] text-xs">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-xs font-mono">
                          {new Date(event.timestamp).toLocaleDateString()}
                          <br />
                          <span className="text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {event.user ? (
                            <div>
                              <div className="font-medium truncate">
                                {event.user.name}
                              </div>
                              <div className="text-muted-foreground truncate hidden sm:block">
                                {event.user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono text-muted-foreground truncate">
                              {event.userId}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${getActionColor(
                              event.action,
                            )}`}
                          >
                            {event.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          {getTableNameLabel(event.tableName)}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1 rounded truncate">
                              {event.recordId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(event.recordId)}
                              className="h-5 w-5 p-0"
                            >
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden xl:table-cell">
                          <code className="text-xs bg-muted px-1 rounded truncate">
                            {event.fieldName || "-"}
                          </code>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          {event.action === AuditAction.CREATE && (
                            <span className="text-green-600">Created</span>
                          )}
                          {event.action === AuditAction.DELETE && (
                            <span className="text-red-600">Deleted</span>
                          )}
                          {event.action === AuditAction.UPDATE &&
                            event.fieldName && (
                              <span className="text-blue-600">Updated</span>
                            )}
                          {event.action === AuditAction.ARCHIVE && (
                            <span className="text-yellow-600">Archived</span>
                          )}
                          {event.action === AuditAction.UNARCHIVE && (
                            <span className="text-purple-600">Unarchived</span>
                          )}
                          {event.action ===
                            AuditAction.CERTIFICATE_GENERATED && (
                            <span className="text-indigo-600">Generated</span>
                          )}
                          {event.action ===
                            AuditAction.CERTIFICATE_DOWNLOADED && (
                            <span className="text-blue-600">Downloaded</span>
                          )}
                          {event.action ===
                            AuditAction.CERTIFICATE_ACCESSED && (
                            <span className="text-purple-600">Accessed</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEvent(event)}
                            className="h-7 w-7 p-0"
                          >
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {hasMore && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setOffset((prev) => prev + 50)}
                      disabled={loading}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="!max-w-[80vw] !max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected audit event
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
            {selectedEvent && (
              <div className="space-y-6">
                {/* Basic Event Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Event ID
                    </label>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      {selectedEvent.id}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Timestamp
                    </label>
                    <div className="text-sm">
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      User
                    </label>
                    <div className="text-sm">
                      {selectedEvent.user ? (
                        <div>
                          <div className="font-medium">
                            {selectedEvent.user.name}
                          </div>
                          <div className="text-muted-foreground">
                            {selectedEvent.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {selectedEvent.userId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Action
                    </label>
                    <div>
                      <Badge className={getActionColor(selectedEvent.action)}>
                        {selectedEvent.action}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Table
                    </label>
                    <div className="text-sm">
                      {getTableNameLabel(selectedEvent.tableName)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Record ID
                    </label>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      {selectedEvent.recordId}
                    </div>
                  </div>

                  {selectedEvent.fieldName && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Field
                      </label>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {selectedEvent.fieldName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Changes Section */}
                {(selectedEvent.action === AuditAction.UPDATE ||
                  selectedEvent.action === AuditAction.CREATE ||
                  selectedEvent.action === AuditAction.DELETE) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Changes</h3>

                    {selectedEvent.action === AuditAction.CREATE && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          New Value
                        </label>
                        <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                          {formatValue(selectedEvent.newValue)}
                        </pre>
                      </div>
                    )}

                    {selectedEvent.action === AuditAction.DELETE && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Deleted Value
                        </label>
                        <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                          {formatValue(selectedEvent.oldValue)}
                        </pre>
                      </div>
                    )}

                    {selectedEvent.action === AuditAction.UPDATE &&
                      selectedEvent.fieldName && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Old Value
                            </label>
                            <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                              {formatValue(selectedEvent.oldValue)}
                            </pre>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              New Value
                            </label>
                            <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                              {formatValue(selectedEvent.newValue)}
                            </pre>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Metadata Section */}
                {selectedEvent.metadata && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Metadata</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Additional Context
                      </label>
                      <pre className="text-sm bg-muted p-4 rounded overflow-x-auto max-h-96">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
