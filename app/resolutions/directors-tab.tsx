"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Crown,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from "lucide-react";
import { ResolutionType, ResolutionStatus } from "@/lib/types";
import { Resolution } from "@/lib/types/interfaces";
import { ResolutionForm } from "./resolution-form";
import Link from "next/link";

interface DirectorsTabProps {
  entityId: string;
  entityName: string;
}

export function DirectorsTab({ entityId, entityName }: DirectorsTabProps) {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        entityId,
        category: "directors",
      });

      const response = await fetch(`/api/resolutions?${params}`);
      const result = await response.json();

      if (result.success) {
        setResolutions(result.data);
      } else {
        console.error("Failed to fetch resolutions:", result.error);
        setResolutions([]);
      }
    } catch (error) {
      console.error("Error fetching resolutions:", error);
      setResolutions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolutions();
  }, [entityId]);

  const handleDelete = async (resolution: Resolution) => {
    try {
      const response = await fetch(`/api/resolutions/${resolution.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await fetchResolutions(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting resolution:", error);
    }
  };

  const handleResolutionSaved = () => {
    setShowCreateDialog(false);
    fetchResolutions();
  };

  const formatResolutionType = (type: string) => {
    switch (type) {
      case ResolutionType.APPOINTMENT_OF_DIRECTOR:
        return "Appointment of Director";
      case ResolutionType.RESIGNATION_OF_DIRECTOR:
        return "Resignation of Director";
      case ResolutionType.REMOVAL_OF_DIRECTOR:
        return "Removal of Director";
      case ResolutionType.APPOINTMENT_OF_COMPANY_SECRETARY:
        return "Appointment of Company Secretary";
      case ResolutionType.CHANGE_OF_REGISTERED_OFFICE:
        return "Change of Registered Office";
      case ResolutionType.ISSUE_OF_SHARES:
        return "Issue of Shares";
      case ResolutionType.TRANSFER_OF_SHARES:
        return "Transfer of Shares";
      case ResolutionType.DECLARATION_OF_DIVIDENDS:
        return "Declaration of Dividends";
      case ResolutionType.APPROVAL_OF_FINANCIAL_STATEMENTS:
        return "Approval of Financial Statements";
      case ResolutionType.LODGEMENT_OF_ANNUAL_REVIEW:
        return "Lodgement of Annual Review";
      case ResolutionType.CHANGE_OF_COMPANY_NAME:
        return "Change of Company Name";
      case ResolutionType.CHANGE_TO_COMPANY_CONSTITUTION:
        return "Change to Company Constitution";
      case ResolutionType.ADOPTION_OF_A_CONSTITUTION:
        return "Adoption of a Constitution";
      case ResolutionType.OPENING_A_BANK_ACCOUNT:
        return "Opening a Bank Account";
      case ResolutionType.EXECUTION_OF_CONTRACTS:
        return "Execution of Contracts";
      case ResolutionType.SOLVENCY_RESOLUTION:
        return "Solvency Resolution";
      case ResolutionType.LOANS_TO_DIRECTORS:
        return "Loans to Directors";
      case ResolutionType.DIRECTORS_INTERESTS_DISCLOSURE:
        return "Director's Interests Disclosure";
      case ResolutionType.CALLING_A_GENERAL_MEETING:
        return "Calling a General Meeting";
      case ResolutionType.DISTRIBUTION_OF_PROFITS:
        return "Distribution of Profits";
      case ResolutionType.APPOINTMENT_OF_AUDITOR:
        return "Appointment of Auditor";
      case ResolutionType.APPROVAL_OF_RELATED_PARTY_TRANSACTIONS:
        return "Approval of Related Party Transactions";
      case ResolutionType.RECORD_OF_RESOLUTIONS_WITHOUT_MEETING:
        return "Record of Resolutions Without Meeting";
      case ResolutionType.GENERAL_BUSINESS:
        return "General Business";
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ResolutionStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ResolutionStatus.DRAFT:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case ResolutionStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ResolutionStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case ResolutionStatus.DRAFT:
        return "bg-yellow-100 text-yellow-800";
      case ResolutionStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case ResolutionStatus.SUPERSEDED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredResolutions = resolutions.filter(
    (resolution) =>
      resolution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatResolutionType(resolution.type)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      resolution.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.referenceNumber &&
        resolution.referenceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading directors' resolutions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Directors' Resolutions
        </h1>
        <p className="text-muted-foreground">
          Manage directors' resolutions for {entityName}
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Resolution Management ({filteredResolutions.length})
              </CardTitle>
              <CardDescription>
                Create and manage directors' resolutions
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Resolution
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Create New Directors' Resolution</DialogTitle>
                  <DialogDescription>
                    Create a new directors' resolution for {entityName}
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                  <ResolutionForm
                    entityId={entityId}
                    entityName={entityName}
                    onSaved={handleResolutionSaved}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resolutions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Resolutions Table */}
          {filteredResolutions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                No Directors' Resolutions
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No resolutions match your search."
                  : "No directors' resolutions have been created yet."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Resolution
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Resolution Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResolutions.map((resolution) => (
                    <TableRow key={resolution.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{resolution.title}</div>
                          {resolution.description && (
                            <div className="text-sm text-muted-foreground">
                              {resolution.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatResolutionType(resolution.type)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`flex items-center gap-1 ${getStatusColor(
                            resolution.status
                          )}`}
                        >
                          {getStatusIcon(resolution.status)}
                          {resolution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{resolution.referenceNumber || "—"}</TableCell>
                      <TableCell>
                        {resolution.resolutionDate
                          ? new Date(
                              resolution.resolutionDate
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(resolution.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/resolutions/${resolution.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Resolution
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {resolution.title}"? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(resolution)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
