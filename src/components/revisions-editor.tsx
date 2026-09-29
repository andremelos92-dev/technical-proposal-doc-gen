"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createRevision, MAX_REVISIONS, REVISION_PEOPLE, type Revision } from "@/lib/proposal";
import { cn } from "@/lib/utils";

type PersonColumn = keyof typeof REVISION_PEOPLE;

function isPersonColumn(key: keyof Revision): key is PersonColumn {
  return key in REVISION_PEOPLE;
}

/** The names offered for a sign-off column, keeping any other name already entered. */
function personOptions(column: PersonColumn, current: string): readonly string[] {
  const names: readonly string[] = REVISION_PEOPLE[column];
  return current && !names.includes(current) ? [...names, current] : names;
}

const REVISION_FIELDS: { key: keyof Revision; label: string; type?: string; width?: string }[] = [
  { key: "rev", label: "Rev.", width: "w-14" },
  { key: "date", label: "Date", type: "date", width: "w-38" },
  { key: "status", label: "Status", width: "w-28" },
  { key: "preparedBy", label: "Prepared By", width: "w-36" },
  { key: "checkedBy", label: "Checked By", width: "w-36" },
  { key: "approvedBy", label: "Approved By", width: "w-36" },
  { key: "remarks", label: "Remarks" },
];

/** The revision table shown on a document cover (Rev., Date, Status, sign-offs, Remarks). */
export function RevisionsEditor({
  revisions,
  onChange,
}: {
  revisions: Revision[];
  onChange: (revisions: Revision[]) => void;
}) {
  const setValue = (index: number, key: keyof Revision, value: string) =>
    onChange(revisions.map((revision, i) => (i === index ? { ...revision, [key]: value } : revision)));

  return (
    <div className="grid gap-2">
      <Label>Revisions</Label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-muted-foreground text-left">
              {REVISION_FIELDS.map((column) => (
                <th key={column.key} className={cn("font-medium", column.width)}>
                  {column.label}
                </th>
              ))}
              <th className="w-9">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((revision, index) => (
              <tr key={index}>
                {REVISION_FIELDS.map((column) => (
                  <td key={column.key}>
                    {isPersonColumn(column.key) ? (
                      <NativeSelect
                        aria-label={`${column.label} (row ${index + 1})`}
                        value={revision[column.key]}
                        onChange={(event) => setValue(index, column.key, event.target.value)}
                      >
                        <option value="">–</option>
                        {personOptions(column.key, revision[column.key]).map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </NativeSelect>
                    ) : (
                      <Input
                        aria-label={`${column.label} (row ${index + 1})`}
                        type={column.type}
                        value={revision[column.key]}
                        onChange={(event) => setValue(index, column.key, event.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove revision ${revision.rev || index + 1}`}
                    onClick={() => onChange(revisions.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...revisions, createRevision(String(revisions.length))])}
          disabled={revisions.length >= MAX_REVISIONS}
        >
          <Plus /> Add Revision
        </Button>
        <span className="text-muted-foreground text-xs">
          Up to {MAX_REVISIONS} revisions fit in the table.
        </span>
      </div>
    </div>
  );
}
