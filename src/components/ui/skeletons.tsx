import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// ============================================
// Reusable Skeleton Components
// ============================================

interface SkeletonProps {
  className?: string;
}

// ============================================
// Card Skeletons
// ============================================

/** Skeleton for stat cards (dashboard overview) */
export const StatCardSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("rounded-xl border bg-card p-5", className)}>
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  </div>
);

/** Grid of stat card skeletons */
export const StatCardsGridSkeleton = ({ 
  count = 4, 
  className 
}: { count?: number; className?: string }) => (
  <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// Pricing Card Skeletons
// ============================================

/** Skeleton for pricing cards */
export const PricingCardSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("rounded-2xl border bg-card p-6 flex flex-col", className)}>
    <div className="text-center mb-8 space-y-3">
      <Skeleton className="h-6 w-24 mx-auto" />
      <Skeleton className="h-10 w-32 mx-auto" />
      <Skeleton className="h-4 w-40 mx-auto" />
    </div>
    <div className="space-y-4 mb-8 flex-grow">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
    <Skeleton className="h-11 w-full rounded-lg" />
  </div>
);

/** Grid of pricing card skeletons */
export const PricingGridSkeleton = ({ 
  count = 4, 
  className 
}: { count?: number; className?: string }) => (
  <div className={cn("grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <PricingCardSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// Table Skeletons
// ============================================

/** Skeleton for table rows */
export const TableRowSkeleton = ({ 
  columns = 5, 
  className 
}: { columns?: number; className?: string }) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className={cn("h-4", i === 0 ? "w-24" : i === columns - 1 ? "w-16" : "w-32")} />
      </td>
    ))}
  </tr>
);

/** Skeleton for full table */
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 5,
  showHeader = true,
  className 
}: { rows?: number; columns?: number; showHeader?: boolean; className?: string }) => (
  <div className={cn("overflow-hidden rounded-lg border", className)}>
    <table className="w-full">
      {showHeader && (
        <thead className="bg-muted/50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================
// List Skeletons
// ============================================

/** Skeleton for list item with icon and text */
export const ListItemSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("flex items-center gap-4 p-4", className)}>
    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

/** Skeleton for multiple list items */
export const ListSkeleton = ({ 
  count = 5, 
  className 
}: { count?: number; className?: string }) => (
  <div className={cn("divide-y rounded-lg border", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <ListItemSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// Card Content Skeletons
// ============================================

/** Skeleton for a card with header and content */
export const CardSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("rounded-xl border bg-card", className)}>
    <div className="p-6 space-y-2 border-b">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-60" />
    </div>
    <div className="p-6 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  </div>
);

/** Skeleton for support tickets */
export const TicketSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("rounded-xl border bg-card p-6", className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  </div>
);

/** Skeleton for ticket list */
export const TicketListSkeleton = ({ 
  count = 3, 
  className 
}: { count?: number; className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <TicketSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// Form Skeletons
// ============================================

/** Skeleton for form fields */
export const FormFieldSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("space-y-2", className)}>
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

/** Skeleton for settings card */
export const SettingsCardSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("rounded-xl border bg-card", className)}>
    <div className="p-6 space-y-2 border-b">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="p-6 space-y-4">
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  </div>
);

// ============================================
// Dashboard Page Skeletons
// ============================================

/** Full dashboard loading skeleton */
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="flex">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-64 border-r bg-card/50 p-4 space-y-4">
        <Skeleton className="h-8 w-32 mb-6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      {/* Main content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <StatCardsGridSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

/** Admin layout content skeleton */
export const AdminContentSkeleton = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

// ============================================
// Referral Dashboard Skeletons
// ============================================

/** Skeleton for referral stats grid */
export const ReferralStatsSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("grid gap-4 md:grid-cols-4", className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

/** Skeleton for referral table */
export const ReferralTableSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 flex-1 rounded-lg" />
    </div>
    <TableSkeleton rows={5} columns={4} />
  </div>
);
