import { useState } from "react";
import { trpc } from "@/lib/hooks/use-trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CollaboratorsTab({ entityId }: { entityId: string }) {
  const [inviteRole, setInviteRole] = useState<"Admin" | "Editor" | "Viewer">(
    "Viewer",
  );
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const { data: collaborators, refetch } = trpc.entities.getById.useQuery(
    { id: entityId },
    { enabled: !!entityId },
  );
  const { data: invitations } = trpc.invitations.list.useQuery(
    { entityId },
    { enabled: !!entityId },
  );
  const inviteMutation = trpc.invitations.create.useMutation();

  if (!entityId) {
    return <div>Please select an entity to manage collaborators.</div>;
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    setMagicLink(null);
    try {
      // Create invitation with a placeholder email (magic link only)
      const result = await inviteMutation.mutateAsync({
        entityId,
        email: `magic-link+${Math.random()
          .toString(36)
          .slice(2, 10)}@example.org`, // placeholder
        role: inviteRole,
      });
      if (result && result.token) {
        const link = `${window.location.origin}/accept-invite?token=${result.token}`;
        setMagicLink(link);
        setInviteStatus("Magic link generated!");
      } else if (result && result.id && result.token === undefined) {
        // fallback: try to get token from invitations list
        await refetch();
        setInviteStatus("Invitation created.");
      }
    } catch (err: any) {
      setInviteStatus(err.message || "Failed to create invitation");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Current Collaborators</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(collaborators?.data?.userEntityAccess ?? []).map(
              (access: any) => (
                <TableRow key={access.userId}>
                  <TableCell>
                    {access.user?.name || access.user?.email || access.userId}
                  </TableCell>
                  <TableCell>{access.user?.email || "-"}</TableCell>
                  <TableCell>{access.role}</TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
        <h3 className="font-semibold mt-6 mb-2">Pending Invitations</h3>
        <ul className="mb-4">
          {(invitations ?? []).map((inv: any) => (
            <li key={inv.id} className="flex items-center gap-2 mb-1">
              <span className="font-mono">
                /accept-invite?token={inv.token}
              </span>
              <span className="text-xs text-muted-foreground">
                ({inv.role})
              </span>
              <span className="text-xs">
                {inv.accepted ? "Accepted" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={handleInvite} className="flex gap-2 items-end">
          <div>
            <label className="block text-xs mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <Button type="submit" disabled={inviteMutation.status === "pending"}>
            Generate Magic Link
          </Button>
        </form>
        {magicLink && (
          <div className="mt-2 text-sm">
            <span className="font-mono">{magicLink}</span>
            <Button
              type="button"
              size="sm"
              className="ml-2"
              onClick={() => navigator.clipboard.writeText(magicLink)}
            >
              Copy
            </Button>
          </div>
        )}
        {inviteStatus && <div className="mt-2 text-sm">{inviteStatus}</div>}
      </CardContent>
    </Card>
  );
}
