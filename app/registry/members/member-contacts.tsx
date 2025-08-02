"use client";

import { useState, useEffect } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User, Mail, Phone } from "lucide-react";
import { MemberContact } from "@/lib/types/interfaces/Member";

interface MemberContactsProps {
  memberId: string;
  entityId: string;
}

export function MemberContacts({ memberId, entityId }: MemberContactsProps) {
  const [contacts, setContacts] = useState<MemberContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<MemberContact | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    isPrimary: false,
  });

  useEffect(() => {
    fetchContacts();
  }, [memberId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/registry/members/${memberId}/contacts`,
      );
      const result = await response.json();

      if (result.success) {
        setContacts(result.data);
      } else {
        setError(result.error || "Failed to fetch contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setError("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingContact
        ? `/api/registry/members/${memberId}/contacts/${editingContact.id}`
        : `/api/registry/members/${memberId}/contacts`;

      const method = editingContact ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowForm(false);
        setEditingContact(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "",
          isPrimary: false,
        });
        fetchContacts();
      } else {
        setError(result.error || "Failed to save contact");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      setError("Failed to save contact");
    }
  };

  const handleEdit = (contact: MemberContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
      isPrimary: contact.isPrimary,
    });
    setShowForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(
        `/api/registry/members/${memberId}/contacts/${contactId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        fetchContacts();
      } else {
        setError(result.error || "Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError("Failed to delete contact");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({ name: "", email: "", phone: "", role: "", isPrimary: false });
    setError(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading contacts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Manage contact information for this member
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 border rounded-lg p-4"
          >
            <h4 className="font-medium">
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contact name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary Contact">
                      Primary Contact
                    </SelectItem>
                    <SelectItem value="Authorized Signatory">
                      Authorized Signatory
                    </SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Secretary">Secretary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+61 400 000 000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) =>
                  setFormData({ ...formData, isPrimary: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="isPrimary" className="text-sm font-medium">
                Primary Contact
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {editingContact ? "Update Contact" : "Add Contact"}
              </Button>
            </div>
          </form>
        )}

        {contacts.length === 0 && !showForm ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="mx-auto h-12 w-12 mb-4" />
            <p>No contacts added yet</p>
            <p className="text-sm">Click "Add Contact" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{contact.name}</h4>
                      {contact.isPrimary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                      {contact.role && (
                        <Badge variant="outline">{contact.role}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      {contact.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
