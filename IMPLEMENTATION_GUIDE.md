# Products Pagination & Search - Implementation Guide

## Overview

This guide explains how to implement backend pagination and search filtering for products, with different UI patterns for desktop (pagination buttons) and mobile (infinite scroll using cursor-based pagination).

## Why This Approach?

1. **Backend Pagination**: Moves filtering to the database (more efficient than client-side filtering)
2. **Cursor-based for Infinite Scroll**: More efficient than offset-based pagination, especially as data grows
3. **Offset-based for Desktop**: Simpler for "Page 1, 2, 3..." UI patterns
4. **Breakpoint Detection**: Prevents duplicate API calls by conditionally enabling queries
5. **Same Router**: Both patterns use the same backend endpoint, just with different parameters
6. **URL State Management**: Using `nuqs` for shareable URLs and browser history support
7. **React 19 Optimizations**: Using `useDeferredValue` for efficient search debouncing without manual effects

## Key Concepts

### Cursor-based Pagination
- Uses the last item's ID as a cursor to fetch the next page
- More efficient: `WHERE id > cursor` is faster than `OFFSET 1000`
- Better for real-time data: avoids skipping/duplicating items if data changes
- Perfect for infinite scroll

### Offset-based Pagination
- Uses page numbers with `OFFSET` and `LIMIT`
- Simpler for "Page 1 of 5" UI patterns
- Good for desktop where users jump between pages

### React Query's `enabled` Option
- Prevents queries from running when `enabled: false`
- Critical for avoiding duplicate calls when switching between mobile/desktop

### URL State Management with `nuqs`
- Syncs component state with URL query parameters
- Enables shareable URLs (e.g., `?search=produto&page=2`)
- Browser back/forward navigation works automatically
- State persists on page reload

### React's `useDeferredValue`
- Defers value updates for expensive operations (like API calls)
- Keeps UI responsive while deferring heavy work
- Better than manual debouncing with `useEffect` + `setTimeout`
- Automatically managed by React's scheduler

---

## Step-by-Step Implementation

### Step 1: Backend - Update Products Router

**File**: `src/server/api/routers/products/index.ts`

**What to do:**
1. Create a Zod schema for the input that accepts both pagination modes:
   ```typescript
   const ListProductsSchema = z.object({
     cursor: z.number().int().positive().optional(),
     page: z.number().int().positive().optional(),
     limit: z.number().int().positive().min(1).max(100).default(10),
     search: z.string().optional(),
   })
   ```

2. Modify the `list` procedure to:
   - Accept the schema as input
   - Build a query builder that supports both cursor and offset pagination
   - Add search filtering using Drizzle's `like` or `ilike`
   - Return paginated response with appropriate metadata

**Why:**
- The backend needs to support both pagination modes
- Search filtering should happen in the database (more efficient)
- We need metadata (nextCursor, hasMore, totalPages) for the frontend

**Key Implementation Details:**

```typescript
// Pseudo-code structure:
export const productsRouter = createTRPCRouter({
  list: publicProcedure
    .input(ListProductsSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.db.select().from(products);
      
      // Apply search filter
      if (input.search) {
        query = query.where(
          or(
            like(products.name, `%${input.search}%`),
            like(products.description, `%${input.search}%`)
          )
        );
      }
      
      // Cursor-based pagination
      if (input.cursor !== undefined) {
        query = query.where(gt(products.id, input.cursor));
        const items = await query
          .orderBy(asc(products.id))
          .limit(input.limit + 1); // Fetch one extra to check hasMore
        
        const hasMore = items.length > input.limit;
        const actualItems = hasMore ? items.slice(0, -1) : items;
        const nextCursor = hasMore ? actualItems[actualItems.length - 1]?.id : null;
        
        return {
          items: actualItems,
          pagination: { nextCursor, hasMore }
        };
      }
      
      // Offset-based pagination
      if (input.page !== undefined) {
        const offset = (input.page - 1) * input.limit;
        const [items, totalResult] = await Promise.all([
          query.orderBy(desc(products.createdAt))
            .limit(input.limit)
            .offset(offset),
          // Count total matching records
        ]);
        
        const total = /* count query */;
        const totalPages = Math.ceil(total / input.limit);
        
        return {
          items,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages,
            hasMore: input.page < totalPages
          }
        };
      }
      
      // Fallback: return all (for backward compatibility during migration)
      return { items: await query.orderBy(desc(products.createdAt)), pagination: {} };
    }),
});
```

**Important Notes:**
- Use `gt(products.id, cursor)` for cursor-based (not `gte` - we want items AFTER the cursor)
- Fetch `limit + 1` items for cursor-based to check `hasMore` efficiently
- Always order cursor-based by `id` ascending (for consistent cursor behavior)
- Order offset-based by `createdAt` descending (for newest first)

---

### Step 2: Create Breakpoint Detection Hook

**File**: `src/hooks/useBreakpoint.ts` (new file)

**What to do:**
Create a hook that detects if the viewport is mobile or desktop.

**Why:**
- We need to know the viewport size to conditionally enable queries
- Prevents both desktop and mobile queries from running simultaneously

**Implementation:**

```typescript
"use client"

import { useEffect, useState } from "react"

export const useBreakpoint = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Handle SSR: start with false, update on mount
    const checkBreakpoint = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkBreakpoint()

    // Listen to resize events
    window.addEventListener("resize", checkBreakpoint)

    return () => {
      window.removeEventListener("resize", checkBreakpoint)
    }
  }, [breakpoint])

  return isMobile
}
```

**Alternative using `matchMedia` (more performant):**

```typescript
"use client"

import { useEffect, useState } from "react"

export const useBreakpoint = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    
    // Set initial value
    setIsMobile(mediaQuery.matches)

    // Listen to changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [breakpoint])

  return isMobile
}
```

**Why `matchMedia` is better:**
- More performant (browser optimizes media query changes)
- Fires only when crossing the breakpoint threshold
- Better for battery life on mobile devices

---

### Step 3: Create Desktop Pagination Hook

**File**: `src/hooks/useProductsPagination.ts` (new file)

**What to do:**
Create a hook that manages desktop pagination using `useQuery`. Note that page state is managed in the component using `nuqs`, not in the hook.

**Why:**
- Encapsulates pagination logic
- Uses `enabled: !isMobile` to prevent running on mobile
- Pure hook - no side effects, just data fetching
- Page state managed by component via URL (nuqs)

**Implementation:**

```typescript
"use client"

import { keepPreviousData } from "@tanstack/react-query"
import { api } from "~/trpc/react"

export const useProductsPagination = (
  searchTerm: string,
  isMobile: boolean,
  page: number,
  pageSize: number = 10
) => {
  const { data, isLoading, isError, error } = api.products.list.useQuery(
    {
      page,
      limit: pageSize,
      search: searchTerm.trim() || undefined,
    },
    {
      enabled: !isMobile, // Only run on desktop
      placeholderData: keepPreviousData, // Smooth transitions between pages
    }
  )

  return {
    products: data?.items ?? [],
    isLoading,
    isError,
    error,
    totalPages: data?.pagination.totalPages ?? 0,
    hasMore: data?.pagination.hasMore ?? false,
    total: data?.pagination.total ?? 0,
  }
}
```

**Key Points:**
- `enabled: !isMobile` ensures this query only runs on desktop
- `placeholderData: keepPreviousData` keeps showing previous page data while loading next page (better UX)
- Hook receives `page` as parameter (managed by component via nuqs)
- No internal state management - pure data fetching hook

---

### Step 4: Create Mobile Infinite Query Hook

**File**: `src/hooks/useProductsInfinite.ts` (new file)

**What to do:**
Create a hook that manages infinite scroll using `useInfiniteQuery` with cursor-based pagination.

**Why:**
- Uses cursor-based pagination (more efficient)
- React Query's `useInfiniteQuery` handles the complexity of managing multiple pages
- Only enabled on mobile

**Implementation:**

```typescript
"use client"

import { api } from "~/trpc/react"

export const useProductsInfinite = (
  searchTerm: string,
  isMobile: boolean
) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = api.products.list.useInfiniteQuery(
    {
      cursor: undefined, // Start with undefined for first page
      limit: 20, // Larger page size for infinite scroll
      search: searchTerm.trim() || undefined,
    },
    {
      enabled: isMobile, // Only run on mobile
      getNextPageParam: (lastPage) => {
        // Return the next cursor if there are more pages
        if (lastPage.pagination.hasMore && lastPage.pagination.nextCursor) {
          return lastPage.pagination.nextCursor
        }
        return undefined // No more pages
      },
    }
  )

  // Flatten all pages into a single array
  const products = data?.pages.flatMap((page) => page.items) ?? []

  return {
    products,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  }
}
```

**Key Points:**
- `getNextPageParam` tells React Query what to pass as `pageParam` for the next page
- Returns `nextCursor` if `hasMore` is true, `undefined` otherwise
- `data.pages` is an array of pages, each containing `items` and `pagination`
- Flatten pages to get a single array of products

---

### Step 5: Create Infinite Scroll Observer Component

**File**: `src/components/products/InfiniteScrollObserver.tsx` (new file)

**What to do:**
Create a component that uses Intersection Observer API to trigger loading when user scrolls near the bottom.

**Why:**
- Intersection Observer is the modern, performant way to detect when an element enters the viewport
- Reusable component that can be placed at the bottom of the list
- Automatically triggers `fetchNextPage` when scrolled into view

**Implementation:**

```typescript
"use client"

import { useEffect, useRef } from "react"

interface InfiniteScrollObserverProps {
  onIntersect: () => void
  hasMore: boolean
  isLoading: boolean
}

export const InfiniteScrollObserver = ({
  onIntersect,
  hasMore,
  isLoading,
}: InfiniteScrollObserverProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          onIntersect()
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before reaching the element
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [onIntersect, hasMore, isLoading])

  if (!hasMore) return null

  return (
    <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true">
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          Carregando mais produtos...
        </div>
      )}
    </div>
  )
}
```

**Key Points:**
- `rootMargin: "100px"` triggers loading 100px before the sentinel enters viewport (smoother UX)
- Only observe if `hasMore` is true and not currently loading
- Clean up observer on unmount or when dependencies change
- Show loading indicator when fetching next page

---

### Step 6: Update ProductsSession Component

**File**: `src/components/products/ProductsSession.tsx`

**What to do:**
1. Set up `NuqsAdapter` in root layout
2. Import the new hooks and components
3. Add breakpoint detection
4. Use `nuqs` for URL state management (search and page)
5. Use `useDeferredValue` for efficient search debouncing
6. Use both hooks conditionally
7. Update UI to show pagination controls (desktop) or infinite scroll observer (mobile)
8. Remove client-side filtering (now handled by backend)

**Implementation Steps:**

**6.0: Add NuqsAdapter to Root Layout**

**File**: `src/app/layout.tsx`

```typescript
import { NuqsAdapter } from "nuqs/adapters/next/app"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NuqsAdapter>
          {/* Your app providers and children */}
        </NuqsAdapter>
      </body>
    </html>
  )
}
```

**6.1: Add imports and URL state management**

```typescript
import { useBreakpoint } from "~/hooks/useBreakpoint"
import { useProductsPagination } from "~/hooks/useProductsPagination"
import { useProductsInfinite } from "~/hooks/useProductsInfinite"
import { InfiniteScrollObserver } from "~/components/products/InfiniteScrollObserver"
import { useState, useDeferredValue } from "react"
import { useQueryState } from "nuqs"

// URL state management
const [searchTerm, setSearchTerm] = useQueryState("search", {
  defaultValue: "",
  clearOnDefault: true,
})
const [page, setPage] = useQueryState("page", {
  parse: (value) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
  },
  serialize: (value) => (value === 1 ? "" : String(value)),
  defaultValue: 1,
})
```

**6.2: Add deferred search and handler**

```typescript
// Defer search term updates to avoid excessive API calls while typing
const deferredSearchTerm = useDeferredValue(searchTerm ?? "")

// Handler that updates search and resets page in one action
const handleSearchChange = (value: string) => {
  setSearchTerm(value || null)
  setPage(1) // Reset to page 1 when search changes
}
```

**6.3: Add breakpoint detection and hooks**

```typescript
const isMobile = useBreakpoint()
const pagination = useProductsPagination(deferredSearchTerm, isMobile, page, 10)
const infinite = useProductsInfinite(deferredSearchTerm, isMobile)

// Get products based on device type
const products = isMobile ? infinite.products : pagination.products
const isLoading = isMobile ? infinite.isLoading : pagination.isLoading
```

**6.4: Remove client-side filtering**

Remove the `filteredProducts` useMemo - search is now handled by backend.

**6.5: Update product grid rendering**

```typescript
<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
  {isLoading && products.length === 0
    ? Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-[260px] rounded-2xl border border-border/60" />
      ))
    : products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting && deleteTarget?.id === product.id}
        />
      ))}
</div>
```

**6.6: Add search input with handler**

```typescript
<Input
  value={searchTerm ?? ""}
  onChange={(event) => handleSearchChange(event.target.value)}
  placeholder="Buscar produtos por nome, descrição ou preço..."
/>
```

**6.7: Add pagination controls (desktop only)**

After the product grid, add:

```typescript
{!isMobile && (
  <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/80 p-4">
    <div className="text-sm text-muted-foreground">
      Página {page} de {pagination.totalPages || 1}
      {pagination.total > 0 && ` • ${pagination.total} produtos encontrados`}
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1 || pagination.isLoading}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        onClick={() => setPage(page + 1)}
        disabled={!pagination.hasMore || pagination.isLoading}
      >
        Próxima
      </Button>
    </div>
  </div>
)}
```

**6.8: Add infinite scroll observer (mobile only)**

After the product grid, add:

```typescript
{isMobile && (
  <InfiniteScrollObserver
    onIntersect={() => infinite.fetchNextPage()}
    hasMore={infinite.hasNextPage}
    isLoading={infinite.isFetchingNextPage}
  />
)}
```

**6.9: Update stats calculation**

Since we're paginating, stats are calculated from the current view. You can:
- Show stats from current products view (as implemented)
- Or fetch stats separately from backend
- Or use pagination metadata for total counts

---

### Step 7: Update useProducts Hook (Cache Invalidation)

**File**: `src/hooks/useProducts.ts`

**What to do:**
Update cache invalidation to work with both query types.

**Why:**
When creating/updating/deleting products, we need to invalidate both the pagination query and infinite query caches.

**Implementation:**

```typescript
const trpcUtils = api.useUtils();

const invalidateProducts = () => {
  // Invalidate all products queries (both pagination and infinite)
  trpcUtils.products.list.invalidate();
};

const createProduct = api.products.create.useMutation({
  onSuccess: () => {
    toast.success(`Produto criado com sucesso`);
    invalidateProducts();
  },
  // ... rest
});

// Same for updateProduct and deleteProduct
```

**Why `invalidate()` without parameters:**
- Invalidates all queries for `products.list`, regardless of their input parameters
- Works for both `useQuery` (pagination) and `useInfiniteQuery` (infinite scroll)
- Simpler than trying to invalidate specific query keys

---

## Testing Checklist

- [ ] Backend returns correct paginated data for cursor-based queries
- [ ] Backend returns correct paginated data for offset-based queries
- [ ] Search filtering works correctly on backend
- [ ] Breakpoint detection works (resize window, check console/network)
- [ ] Desktop pagination buttons work (next/previous)
- [ ] Mobile infinite scroll loads more products when scrolling
- [ ] Only one query runs at a time (check Network tab)
- [ ] Search debouncing works (type quickly, verify limited API calls via `useDeferredValue`)
- [ ] Switching between mobile/desktop doesn't cause duplicate calls
- [ ] Creating/updating/deleting products refreshes the list correctly
- [ ] Loading states show correctly for both patterns
- [ ] Empty states show correctly when no products match search
- [ ] URL state management works (`?search=produto&page=2` in URL)
- [ ] Page resets to 1 when search changes (check URL)
- [ ] Browser back/forward navigation works correctly
- [ ] State persists on page reload
- [ ] Page 1 is removed from URL (clean URLs)

---

## Common Pitfalls & Solutions

### Pitfall 1: Both queries running simultaneously
**Solution**: Always use `enabled: isMobile` or `enabled: !isMobile` in both hooks

### Pitfall 2: Cursor-based pagination returning duplicates
**Solution**: Make sure you're using `gt(products.id, cursor)` not `gte`, and ordering by `id` ascending

### Pitfall 3: Search not resetting pagination
**Solution**: Reset page to 1 directly in the search handler (`handleSearchChange`), not via `useEffect`

### Pitfall 4: Infinite scroll not triggering
**Solution**: Check that `hasMore` is true, `isLoading` is false, and sentinel element is visible

### Pitfall 5: Stats showing incorrect totals
**Solution**: Stats need to come from backend or be calculated from all pages (consider a separate stats endpoint)

---

## Next Steps After Implementation

1. Consider adding a separate stats endpoint for accurate totals
2. Add loading skeletons for "fetching next page" state
3. Add error boundaries for better error handling
4. ✅ URL params for pagination state already implemented (using `nuqs`)
5. Add analytics to track which pagination pattern users prefer

## Key Improvements Made

1. **URL State Management**: Using `nuqs` for shareable URLs (`?search=produto&page=2`)
2. **React 19 Optimization**: Using `useDeferredValue` instead of manual debouncing with `useEffect`
3. **Cleaner Architecture**: Page state managed in component via URL, not in hooks
4. **Direct Actions**: Page reset happens directly in search handler, not via `useEffect` watching state
5. **Pure Hooks**: Pagination hook is now pure - no side effects, just data fetching

---

## Questions?

If you encounter issues:
1. Check browser Network tab to see which queries are running
2. Check React Query DevTools (if installed) to see query states
3. Verify breakpoint detection is working (console.log `isMobile`)
4. Ensure backend returns correct pagination metadata

