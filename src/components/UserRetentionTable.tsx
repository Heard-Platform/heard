import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { UserRetentionRow } from "../types";

interface UserRetentionTableProps {
  users: UserRetentionRow[];
}

const TEXT_PRIMARY = "#0b0b0b";
const TEXT_SECONDARY = "#52514e";
const TEXT_MUTED = "#898781";
const SURFACE = "#fcfcfb";
const SURFACE_ALT = "#f3f3f1";
const GRIDLINE = "#e1e0d9";

const columnHelper = createColumnHelper<UserRetentionRow>();

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const columns = [
  columnHelper.accessor("idPrefix", {
    header: "ID",
    cell: (info) => (
      <span style={{ fontFamily: "monospace", color: TEXT_SECONDARY }}>{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("nickname", {
    header: "Nickname",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("obfuscatedEmail", {
    header: "Email",
  }),
  columnHelper.accessor("obfuscatedPhone", {
    header: "Phone",
  }),
  columnHelper.accessor("createdAt", {
    header: "Joined",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("activeDays", {
    header: "Active days",
  }),
  columnHelper.accessor("activeWeeks", {
    header: "Active weeks",
  }),
  columnHelper.accessor("topPosts", {
    header: "Top posts",
    enableSorting: false,
    cell: (info) => {
      const posts = info.getValue();
      if (posts.length === 0) {
        return <span style={{ color: TEXT_MUTED }}>—</span>;
      }
      return (
        <div>
          {posts.map((post) => (
            <div
              key={post.id}
              title={post.topic}
              style={{
                maxWidth: 280,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 2,
              }}
            >
              <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{post.votes}</span>{" "}
              <span style={{ color: TEXT_SECONDARY }}>votes &middot; {post.topic}</span>
            </div>
          ))}
        </div>
      );
    },
  }),
];

export function UserRetentionTable({ users }: UserRetentionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "activeDays", desc: true }]);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (users.length === 0) {
    return (
      <p style={{ textAlign: "center", color: TEXT_MUTED, padding: "32px 0" }}>No users yet.</p>
    );
  }

  return (
    <div
      style={{
        maxHeight: 600,
        overflowY: "auto",
        borderRadius: 8,
        border: `1px solid ${GRIDLINE}`,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    style={{
                      position: "sticky",
                      top: 0,
                      background: SURFACE,
                      borderBottom: `1px solid ${GRIDLINE}`,
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: TEXT_SECONDARY,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "none",
                          border: "none",
                          padding: 0,
                          font: "inherit",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : sortDirection === "desc" ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr key={row.id} style={{ background: i % 2 === 1 ? SURFACE_ALT : SURFACE }}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    padding: "8px 12px",
                    borderBottom: `1px solid ${GRIDLINE}`,
                    color: TEXT_PRIMARY,
                    verticalAlign: "top",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
