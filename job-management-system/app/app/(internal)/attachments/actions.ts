"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttachmentEntityType } from "@/types/database";

export interface AttachmentFormState {
  error?: string;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — generous for job-site photos, blocks accidental huge uploads

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function uploadAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  revalidatePathValue: string,
  _prevState: AttachmentFormState,
  formData: FormData,
): Promise<AttachmentFormState> {
  const file = formData.get("file");
  const caption = formData.get("caption");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "File is too large (max 15MB)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const path = `${entityType}/${entityId}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, {
    contentType: file.type || undefined,
  });

  if (uploadError) {
    return { error: "Could not upload the file. Please try again." };
  }

  const { error: insertError } = await supabase.from("attachments").insert({
    entity_type: entityType,
    entity_id: entityId,
    file_path: path,
    file_type: file.type || null,
    caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
    uploaded_by: user.id,
  });

  if (insertError) {
    await supabase.storage.from("attachments").remove([path]);
    return { error: "Could not save the attachment record. Please try again." };
  }

  revalidatePath(revalidatePathValue);
  return {};
}

export async function deleteAttachment(
  attachmentId: string,
  filePath: string,
  revalidatePathValue: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("attachments").delete().eq("id", attachmentId);

  if (error) {
    throw new Error("Could not delete the attachment.");
  }

  await supabase.storage.from("attachments").remove([filePath]);
  revalidatePath(revalidatePathValue);
}
