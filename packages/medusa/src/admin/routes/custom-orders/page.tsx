import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Text, 
  Badge,
  Table,
  Button,
} from "@medusajs/ui"
import { ShoppingBag } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

type CustomDesign = {
  file_url: string
  file_id: string
  placement: string
  file_name?: string
}

type OrderItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
  total?: number
  product_title?: string
  variant_title?: string
  custom_design?: CustomDesign
}

type Order = {
  id: string
  display_id: string
  email?: string
  created_at: string
  status: string
  total?: number
  currency_code?: string
  items: OrderItem[]
}

type OrdersResponse = {
  orders: Order[]
  count: number
  offset: number
  limit: number
  total: number
}

const CustomOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const baseUrl =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: { VITE_MEDUSA_BACKEND_URL?: string } }).env
        ?.VITE_MEDUSA_BACKEND_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "")

  const resolveUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) return fileUrl
    return `${baseUrl}${fileUrl}`
  }

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${baseUrl}/admin/custom-orders?limit=${limit}&offset=${offset}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
      }

      const data: OrdersResponse = await response.json()
      console.log("Fetched orders data:", data)
      console.log("First order:", data.orders[0])
      setOrders(data.orders)
      setTotal(data.total)
    } catch (err) {
      console.error("Error fetching custom orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [offset])

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  const formatPrice = (amount: number | undefined, currency: string = "USD") => {
    if (amount === undefined || amount === null) return "N/A"
    // Amount might already be in cents or in base units
    const amountValue = typeof amount === 'number' ? amount : parseFloat(amount)
    if (isNaN(amountValue)) return "N/A"
    // Check if amount is already in base units (less than 1000) or in cents
    const finalAmount = amountValue > 1000 ? amountValue / 100 : amountValue
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(finalAmount)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "N/A"
    }
  }

  if (loading && orders.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Orders with Custom Design</Heading>
        </div>
        <div className="px-6 py-8 text-center">
          <Text>Loading orders...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Orders with Custom Design</Heading>
        </div>
        <div className="px-6 py-8 text-center">
          <Text className="text-red-600">Error: {error}</Text>
          <Button onClick={fetchOrders} className="mt-4">
            Retry
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Orders with Custom Design</Heading>
        <Badge>{total} orders</Badge>
      </div>

      {orders.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text>No orders with custom designs found.</Text>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order ID</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Items with Design</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order) => (
                  <Table.Row
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <Table.Cell>
                      <Text weight="plus">
                        {order.display_id ? `#${order.display_id}` : order.id ? `#${order.id.split('_')[1]?.substring(0, 8)}` : 'N/A'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{order.email || "N/A"}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{formatDate(order.created_at)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge>{order.status || "pending"}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>
                        {formatPrice(order.total, order.currency_code)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{order.items.length} item(s)</Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          {/* Order Details Modal/Expansion */}
          <div className="divide-y px-6 py-4">
            {orders.map((order) => (
              <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <Text weight="plus" size="small">
                      Order #{order.display_id}
                    </Text>
                    <Text size="xsmall" className="text-gray-500">
                      {order.email} • {formatDate(order.created_at)}
                    </Text>
                  </div>
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View Order
                  </Button>
                </div>
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const design = item.custom_design!
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-lg border p-3"
                      >
                        <div className="flex-shrink-0">
                          <a
                            href={resolveUrl(design.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="block overflow-hidden rounded border bg-gray-50"
                          >
                            <img
                              src={resolveUrl(design.file_url)}
                              alt={design.file_name || `Design ${design.placement}`}
                              className="h-20 w-20 object-contain"
                            />
                          </a>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <Text weight="plus" size="small" className="line-clamp-1">
                                {item.product_title || item.title || "Line item"}
                                {item.variant_title && ` · ${item.variant_title}`}
                              </Text>
                              <Text size="xsmall" className="text-gray-500">
                                Quantity: {item.quantity} × {formatPrice(item.unit_price, order.currency_code)}
                              </Text>
                              {design.file_name && (
                                <Text size="xsmall" className="text-gray-500">
                                  File: {design.file_name}
                                </Text>
                              )}
                            </div>
                            <Badge size="small">
                              {design.placement === "front" ? "Front" : "Back"}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <a
                              href={resolveUrl(design.file_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-link text-small"
                            >
                              Open design file
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <Text size="small" className="text-gray-500">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} orders
              </Text>
              <div className="flex items-center gap-2">
                <Button
                  variant="transparent"
                  size="small"
                  disabled={offset === 0}
                  onClick={() => handlePageChange(Math.max(0, offset - limit))}
                >
                  Previous
                </Button>
                <Text size="small" className="text-gray-500">
                  Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
                </Text>
                <Button
                  variant="transparent"
                  size="small"
                  disabled={offset + limit >= total}
                  onClick={() => handlePageChange(offset + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Custom Orders",
  icon: ShoppingBag,
})

export default CustomOrdersPage
