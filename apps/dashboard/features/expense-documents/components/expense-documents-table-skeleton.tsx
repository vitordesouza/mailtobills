import { Card, CardContent } from "@mailtobills/ui/components/card";
import { Skeleton } from "@mailtobills/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mailtobills/ui/components/table";
import {
  ExpenseDocumentsTableColumns,
  ExpenseDocumentsTableHeader,
  ExpenseDocumentsTableHeading,
} from "./expense-documents-table-chrome";

export function ExpenseDocumentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-0 shadow-xs">
      <ExpenseDocumentsTableHeading />
      <CardContent className="p-0">
        <Table className="min-w-[920px] table-fixed">
          <ExpenseDocumentsTableColumns />
          <ExpenseDocumentsTableHeader />
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell>
                  <Skeleton className="size-8 rounded-md" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[22rem] max-w-full" />
                    <Skeleton className="h-3 w-[18rem] max-w-full" />
                  </div>
                </TableCell>
                <TableCell className="border-l">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="border-l">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell className="border-l">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
