import type { ReactNode } from "react";
import { ScrollArea, Table } from "@mantine/core";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Array<Column<T>>;
  emptyText: string;
};

export function DataTable<T>({ rows, columns, emptyText }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <ScrollArea className="data-table">
      <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key}>{column.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, rowIndex) => (
            <Table.Tr key={rowIndex}>
              {columns.map((column) => (
                <Table.Td key={column.key}>{column.render(row)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
