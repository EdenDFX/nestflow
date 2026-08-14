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
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { BulkReassignBar } from "@/components/tasks/bulk-reassign-bar";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Input } from "@/components/ui/input";
import { personLabel } from "@/lib/people/label";
import {
  STATUS_LABELS,
  type NestFlowTask,
  type TaskAssignee,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<NestFlowTask>();
const VIRTUALIZE_AFTER = 40;
const ROW_ESTIMATE_PX = 49;

export function TaskList({
  tasks,
  canAssign = false,
  people = [],
}: {
  tasks: NestFlowTask[];
  canAssign?: boolean;
  people?: TaskAssignee[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const columns = useMemo(() => {
    const selectColumn = canAssign
      ? [
          columnHelper.display({
            id: "select",
            header: () => (
              <span className="sr-only">Select tasks for bulk reassign</span>
            ),
            cell: (info) => {
              const id = info.row.original.id;
              const checked = selected.includes(id);
              return (
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={checked}
                  aria-label={`Select ${info.row.original.title}`}
                  onChange={() => {
                    setSelected((current) =>
                      current.includes(id)
                        ? current.filter((item) => item !== id)
                        : [...current, id],
                    );
                  }}
                />
              );
            },
          }),
        ]
      : [];

    return [
      ...selectColumn,
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
        (row) => row.assignees.map((person) => personLabel(person)).join(", "),
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
    ];
  }, [canAssign, selected]);

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

  const visibleIds = table.getRowModel().rows.map((row) => row.original.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const rows = table.getRowModel().rows;
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = rows.length > VIRTUALIZE_AFTER;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE_PX,
    overscan: 8,
    enabled: shouldVirtualize,
  });
  const virtualRows = shouldVirtualize ? virtualizer.getVirtualItems() : null;
  const paddingTop = virtualRows?.[0]?.start ?? 0;
  const lastVirtual = virtualRows?.[virtualRows.length - 1];
  const paddingBottom = shouldVirtualize
    ? virtualizer.getTotalSize() - (lastVirtual?.end ?? 0)
    : 0;
  const renderedRows = virtualRows
    ? virtualRows.flatMap((item) => {
        const row = rows[item.index];
        return row ? [row] : [];
      })
    : rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter tasks…"
          className="max-w-sm"
          aria-label="Filter tasks"
        />
        {canAssign && visibleIds.length > 0 ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={allVisibleSelected}
              onChange={() => {
                setSelected((current) =>
                  allVisibleSelected
                    ? current.filter((id) => !visibleIds.includes(id))
                    : [...new Set([...current, ...visibleIds])],
                );
              }}
            />
            Select visible
          </label>
        ) : null}
      </div>

      <div
        ref={parentRef}
        className={cn(
          "overflow-x-auto rounded-xl border border-border/80",
          shouldVirtualize && "max-h-[70vh] overflow-y-auto",
        )}
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Task list</caption>
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium" scope="col">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
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
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No tasks yet. Create one to get started.
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 ? (
                  <tr aria-hidden>
                    <td
                      colSpan={columns.length}
                      style={{ height: paddingTop, padding: 0 }}
                    />
                  </tr>
                ) : null}
                {renderedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/70 last:border-0",
                      selected.includes(row.original.id) && "bg-primary/5",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {paddingBottom > 0 ? (
                  <tr aria-hidden>
                    <td
                      colSpan={columns.length}
                      style={{ height: paddingBottom, padding: 0 }}
                    />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {table.getRowModel().rows.length} of {tasks.length} tasks across{" "}
        {Object.keys(STATUS_LABELS).length} statuses.
      </p>

      {canAssign ? (
        <BulkReassignBar
          selectedIds={selected}
          people={people}
          onClear={() => setSelected([])}
        />
      ) : null}
    </div>
  );
}
