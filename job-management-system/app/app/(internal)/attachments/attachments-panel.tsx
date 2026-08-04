import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttachmentEntityType } from "@/types/database";
import { uploadAttachment } from "./actions";
import { UploadForm } from "./upload-form";
import { DeleteAttachmentButton } from "./delete-button";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function AttachmentsPanel({
  entityType,
  entityId,
  revalidatePathValue,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  revalidatePathValue: string;
}) {
  const supabase = await createClient();
  const { data: attachments } = await supabase
    .from("attachments")
    .select("id, file_path, file_type, caption, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  const withUrls = await Promise.all(
    (attachments ?? []).map(async (attachment) => {
      const { data } = await supabase.storage
        .from("attachments")
        .createSignedUrl(attachment.file_path, 60 * 60);
      return { ...attachment, url: data?.signedUrl ?? null };
    }),
  );

  const boundUpload = uploadAttachment.bind(null, entityType, entityId, revalidatePathValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Photos &amp; documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadForm action={boundUpload} />

        {withUrls.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {withUrls.map((attachment) => (
              <div key={attachment.id} className="space-y-1 rounded-md border p-2 text-xs">
                {attachment.url && IMAGE_TYPES.has(attachment.file_type ?? "") ? (
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    <Image
                      src={attachment.url}
                      alt={attachment.caption ?? "Attachment"}
                      width={200}
                      height={128}
                      unoptimized
                      className="h-24 w-full rounded object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={attachment.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-24 items-center justify-center rounded bg-muted text-muted-foreground hover:underline"
                  >
                    View file
                  </a>
                )}
                <p className="truncate">{attachment.caption ?? attachment.file_path.split("/").pop()}</p>
                <DeleteAttachmentButton
                  attachmentId={attachment.id}
                  filePath={attachment.file_path}
                  revalidatePathValue={revalidatePathValue}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
