"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignTechnician } from "../actions";

interface Props {
  jobId: string;
  currentTechnicianId: string | null;
  technicians: { id: string; full_name: string }[];
}

export function TechnicianForm({ jobId, currentTechnicianId, technicians }: Props) {
  const [pending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    const formData = new FormData();
    formData.set("technician_id", value ?? "unassigned");
    startTransition(() => {
      assignTechnician(jobId, formData);
    });
  }

  return (
    <Select
      defaultValue={currentTechnicianId ?? "unassigned"}
      onValueChange={handleChange}
      disabled={pending}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {technicians.map((tech) => (
          <SelectItem key={tech.id} value={tech.id}>
            {tech.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
