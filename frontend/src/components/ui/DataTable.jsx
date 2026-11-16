import EmptyState from "./EmptyState.jsx";

export default function DataTable({
  columns,
  rows,
  getRowKey = (row) => row.id,
  emptyTitle = "Nothing to show yet",
  emptyDescription = "When information is available, it will appear here.",
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-y border-line bg-slate-50/80">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length ? (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="transition-colors hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className={`px-5 py-3.5 text-sm text-slate-700 ${column.className ?? ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-0" colSpan={columns.length}>
                <EmptyState className="min-h-40" title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
