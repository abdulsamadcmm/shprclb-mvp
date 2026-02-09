# Custom Orders Page - Medusa Admin

This is a custom page in the Medusa Admin dashboard that displays all orders containing items with custom designs.

## What Was Created

### 1. API Route (`/admin/custom-orders`)
- **Location**: `packages/medusa/src/api/admin/custom-orders/route.ts`
- **Endpoint**: `GET /admin/custom-orders`
- **Query Parameters**:
  - `limit` (default: 20, max: 100) - Number of orders per page
  - `offset` (default: 0) - Pagination offset
- **Response**: Returns paginated list of orders with custom designs

### 2. UI Route Page
- **Location**: `packages/medusa/src/admin/routes/custom-orders/page.tsx`
- **URL**: `/app/custom-orders`
- **Sidebar**: Appears as "Custom Orders" with a shopping bag icon

## Features

- ✅ Lists all orders that have items with custom designs
- ✅ Pagination support (20 orders per page)
- ✅ Shows order details: ID, customer email, date, status, total
- ✅ Displays all line items with custom designs
- ✅ Shows design preview thumbnails
- ✅ Links to view full order details
- ✅ Links to open design files
- ✅ Shows placement (Front/Back) badges

## Important Notes & Caveats

### 1. **Filtering Approach**
The current implementation filters orders **client-side** after fetching from the database. This means:
- We fetch more orders than needed (10x the limit) to account for filtering
- The total count is approximate
- For better performance with large datasets, consider adding a database-level filter

### 2. **Query Module Usage**
The API route uses Medusa's `query` module which:
- Requires the query service to be available in the container
- Uses GraphQL-like syntax for field selection
- May need adjustment if your Medusa version differs

### 3. **Sidebar Configuration**
- Uses `defineRouteConfig` from `@medusajs/admin-sdk`
- Icon is from `@medusajs/icons` package
- The route appears in the sidebar automatically when configured

### 4. **UI Components**
- Uses Medusa UI components (`@medusajs/ui`) for consistency
- Components used: Container, Heading, Text, Badge, Table, Button
- Follows Medusa admin design patterns

### 5. **Navigation**
- Clicking on an order row navigates to the order details page
- Uses React Router's `useNavigate` hook
- Breadcrumbs are handled automatically by Medusa

### 6. **Image URLs**
- Design images are resolved using the backend URL
- Falls back to `window.location.origin` if backend URL not available
- Handles both absolute and relative URLs

### 7. **Pagination Limitations**
- Current implementation uses simple offset-based pagination
- Total count is approximate due to client-side filtering
- For accurate totals, implement database-level filtering

## How to Improve

1. **Database-Level Filtering**: Add a query that filters orders by `items.metadata.custom_design` at the database level
2. **Caching**: Add caching for frequently accessed orders
3. **Search/Filter**: Add search by order ID, customer email, or date range
4. **Export**: Add ability to export orders with custom designs
5. **Bulk Actions**: Add bulk actions for selected orders

## Testing

1. Start your Medusa server: `npm run dev` or `medusa develop`
2. Log into the admin dashboard at `http://localhost:9000/app`
3. Navigate to "Custom Orders" in the sidebar
4. Verify orders with custom designs are displayed
5. Test pagination by clicking Next/Previous buttons
6. Click on an order to verify navigation works

## Troubleshooting

### Orders Not Showing
- Check that orders have items with `metadata.custom_design`
- Verify the API route is accessible at `/admin/custom-orders`
- Check browser console for errors

### Pagination Not Working
- Verify the API returns correct `total` count
- Check that `offset` and `limit` are being passed correctly

### Images Not Loading
- Verify `VITE_MEDUSA_BACKEND_URL` is set correctly
- Check that design file URLs are accessible
- Verify CORS settings if images are hosted externally
