"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "@/lib/sounds/toast";

import { AttachFileIcon } from "@/components/icons/attach-file";
import { DeleteIcon } from "@/components/icons/delete";
import { DownloadIcon } from "@/components/icons/download";

import { Button } from "@/components/ui/button";
import {
  createAttachmentDownloadUrlAction,
  createAttachmentUploadUrlAction,
  removeAttachmentAction,
} from "@/lib/tasks/collaboration-actions";
import type { TaskAttachment } from "@/lib/tasks/collaboration-types";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({
  taskId,
  attachments,
  r2Configured,
  readOnly = false,
}: {
  taskId: string;
  attachments: TaskAttachment[];
  r2Configured: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!r2Configured) {
      toast.error("Add Cloudflare R2 env vars to enable uploads.");
      return;
    }

    setUploading(true);
    try {
      const prepared = await createAttachmentUploadUrlAction({
        taskId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      if (!prepared.ok || !prepared.uploadUrl) {
        toast.error(prepared.error ?? "Could not start upload.");
        return;
      }

      const response = await fetch(prepared.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        toast.error("Upload to R2 failed.");
        return;
      }

      toast.success("Attachment uploaded.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Attachments</h2>
        {readOnly ? null : (
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading || pending || !r2Configured}
            onClick={() => inputRef.current?.click()}
          >
            <AttachFileIcon className="inline-flex" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
        )}
      </div>

      {!r2Configured ? (
        <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
          Cloudflare R2 is not configured. Add `R2_ACCOUNT_ID`,
          `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET` to
          `.env.local` to enable private attachments.
        </p>
      ) : null}

      <ul className="space-y-2">
        {attachments.length === 0 ? (
          <li className="text-sm text-muted-foreground">No attachments yet.</li>
        ) : (
          attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attachment.sizeBytes)} ·{" "}
                  {attachment.uploaderName ?? "Uploader"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending || !r2Configured}
                  aria-label="Download attachment"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await createAttachmentDownloadUrlAction({
                        attachmentId: attachment.id,
                      });
                      if (!result.ok || !result.downloadUrl) {
                        toast.error(result.error ?? "Could not download.");
                        return;
                      }
                      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
                    })
                  }
                >
                  <DownloadIcon className="inline-flex" size={14} />
                </Button>
                {readOnly ? null : (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label="Remove attachment"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeAttachmentAction({
                        attachmentId: attachment.id,
                        taskId,
                      });
                      if (!result.ok) {
                        toast.error(result.error ?? "Could not remove file.");
                        return;
                      }
                      toast.success("Attachment removed.");
                      router.refresh();
                    })
                  }
                >
                  <DeleteIcon className="inline-flex" size={14} />
                </Button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
