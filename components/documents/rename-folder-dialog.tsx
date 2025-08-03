"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { useUpdateFolder } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";
import { toast } from "sonner";

const renameFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be less than 100 characters")
    .regex(/^[^<>:"/\\|?*]+$/, "Folder name contains invalid characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type RenameFolderFormData = z.infer<typeof renameFolderSchema>;

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: any;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folder,
}: RenameFolderDialogProps) {
  const { selectedEntity } = useEntity();
  const updateFolder = useUpdateFolder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RenameFolderFormData>({
    resolver: zodResolver(renameFolderSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when folder changes
  useEffect(() => {
    if (folder && open) {
      form.reset({
        name: folder.name || "",
        description: folder.description || "",
      });
    }
  }, [folder, open, form]);

  const handleSubmit = async (data: RenameFolderFormData) => {
    if (!folder) {
      toast.error("No folder selected");
      return;
    }

    try {
      setIsSubmitting(true);

      await updateFolder.mutateAsync({
        id: folder.id,
        name: data.name,
        description: data.description || undefined,
      });

      toast.success("Folder updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating folder:", error);
      toast.error("Failed to update folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Rename Folder
          </DialogTitle>
          <DialogDescription>
            Update the name and description of the folder "{folder.name}".
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter folder name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter folder description"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Folder
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}