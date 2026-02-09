import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"

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
  metadata?: {
    custom_design?: CustomDesign
    product_title?: string
    variant_title?: string
  }
}

type Order = {
  id: string
  items?: OrderItem[]
}

function OrderCustomDesignWidget({ data }: { data: Order }) {
  const order = data
  const itemsWithDesign = (order?.items ?? []).filter(
    (item) => item?.metadata?.custom_design
  )

  if (itemsWithDesign.length === 0) {
    return null
  }

  const baseUrl =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: { VITE_MEDUSA_BACKEND_URL?: string } }).env
        ?.VITE_MEDUSA_BACKEND_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "")
  const resolveUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) return fileUrl
    return `${baseUrl}${fileUrl}`
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Custom designs</Heading>
      </div>
      <div className="flex flex-col gap-4 px-6 py-4">
        {itemsWithDesign.map((item) => {
          const design = item.metadata!.custom_design!
          const title =
            item.metadata?.product_title ?? item.title ?? "Line item"
          const variant = item.metadata?.variant_title
          const placement =
            design.placement === "front" ? "Front" : "Back"
          return (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Text size="small" weight="plus" className="line-clamp-1">
                  {title}
                  {variant && ` · ${variant}`}
                </Text>
                <Badge size="small">{placement}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={resolveUrl(design.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 overflow-hidden rounded border bg-gray-50"
                >
                  <img
                    src={resolveUrl(design.file_url)}
                    alt={design.file_name ?? `Design ${placement}`}
                    className="h-16 w-16 object-contain"
                  />
                </a>
                <div className="min-w-0 flex-1">
                  {design.file_name && (
                    <Text size="xsmall" className="text-gray-500">
                      {design.file_name}
                    </Text>
                  )}
                  <a
                    href={resolveUrl(design.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link text-small mt-1 block truncate"
                  >
                    Open design
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderCustomDesignWidget
