"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Input } from "@/components/ui/input";
import {
  STATUS_LABELS,
  type NestFlowTask,
} from "@/lib/tasks/types";

const columnHelper = createColumnHelper<NestFlowTask>();

export function TaskList({ tasks }: { tasks: NestFlowTask[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Task",
        cell: (info) => (
          <Link
            href={`/app/tasks/${info.row.original.id}`}
            className="font-medium hover:text-primary"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        cell: (info) => <PriorityBadge priority={info.getValue()} />,
      }),
      columnHelper.accessor(
        (row) =>
          row.assignees.map((a) => a.fullName ?? a.nestId ?? a.email).join(", "),
        {
          id: "assignees",
          header: "Assignees",
          cell: (info) => (
            <span className="text-sm text-muted-foreground">
              {info.getValue() || "Unassigned"}
            </span>
          ),
        },
      ),
      columnHelper.accessor("dueAt", {
        header: "Due",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as string).toLocaleDateString()
            : "-",
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      globalFilter: query,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter tasks…"
        className="max-w-sm"
        aria-label="Filter tasks"
      />

      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Task list</caption>
          <thead className="border-b border-border bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium" scope="col">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No tasks yet. Create one to get started.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {table.getRowModel().rows.length} of {tasks.length} tasks across{" "}
        {Object.keys(STATUS_LABELS).length} statuses.
      </p>
    </div>
  );
}
