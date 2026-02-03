import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, Label, Switch } from "@medusajs/ui"
import { useEffect, useState } from "react"

type WarehousePrice = {
  id: string
  variant_id: string
  location_id: string
  base_price: number
  currency_code: string
  backorder_enabled: boolean
  backorder_available_date: string | null
}

type StockLocation = {
  id: string
  name: string
}

type WarehousePriceFormData = {
  location_id: string
  base_price: string
  currency_code: string
  backorder_enabled: boolean
  backorder_available_date: string
}

const WarehousePricingWidget = ({ data }: { data: { id: string } }) => {
  const variantId = data.id
  const [prices, setPrices] = useState<WarehousePrice[]>([])
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<WarehousePriceFormData>({
    location_id: "",
    base_price: "",
    currency_code: "INR",
    backorder_enabled: false,
    backorder_available_date: "",
  })

  const fetchData = async () => {
    try {
      const [pricesRes, locationsRes] = await Promise.all([
        fetch(`/admin/warehouse-prices?variant_id=${variantId}`, {
          credentials: "include",
        }),
        fetch(`/admin/stock-locations`, {
          credentials: "include",
        }),
      ])

      const pricesData = await pricesRes.json()
      const locationsData = await locationsRes.json()

      setPrices(pricesData.warehouse_prices || [])
      setLocations(locationsData.stock_locations || [])
    } catch (error) {
      console.error("Failed to fetch warehouse pricing data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [variantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/admin/warehouse-prices", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variant_id: variantId,
          location_id: formData.location_id,
          base_price: Math.round(parseFloat(formData.base_price) * 100), // Convert to cents
          currency_code: formData.currency_code,
          backorder_enabled: formData.backorder_enabled,
          backorder_available_date: formData.backorder_available_date || null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          location_id: "",
          base_price: "",
          currency_code: "INR",
          backorder_enabled: false,
          backorder_available_date: "",
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to save warehouse price:", error)
    } finally {
      setSaving(false)
    }
  }

  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId)
    return location?.name || locationId
  }

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <Container className="p-4">
        <Text>Loading warehouse pricing...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">Warehouse Pricing</Heading>
        <Button size="small" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Price"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Warehouse</Label>
              <select
                id="location"
                value={formData.location_id}
                onChange={(e) =>
                  setFormData({ ...formData, location_id: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select warehouse...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="base_price">Price</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({ ...formData, base_price: e.target.value })
                }
                placeholder="100.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={formData.currency_code}
                onChange={(e) =>
                  setFormData({ ...formData, currency_code: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="backorder"
                checked={formData.backorder_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, backorder_enabled: checked })
                }
              />
              <Label htmlFor="backorder">Allow Backorders</Label>
            </div>
            {formData.backorder_enabled && (
              <div>
                <Label htmlFor="backorder_date">Expected Availability</Label>
                <Input
                  id="backorder_date"
                  type="date"
                  value={formData.backorder_available_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      backorder_available_date: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button type="submit" isLoading={saving}>
              Save Price
            </Button>
          </div>
        </form>
      )}

      {prices.length === 0 ? (
        <Text className="text-gray-500">
          No warehouse-specific prices configured for this variant.
        </Text>
      ) : (
        <div className="space-y-2">
          {prices.map((price) => (
            <div
              key={price.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <Text className="font-medium">
                  {getLocationName(price.location_id)}
                </Text>
                <Text className="text-sm text-gray-500">
                  {price.backorder_enabled && "Backorders allowed"}
                  {price.backorder_available_date &&
                    ` • Expected: ${new Date(price.backorder_available_date).toLocaleDateString()}`}
                </Text>
              </div>
              <Text className="font-semibold">
                {formatPrice(price.base_price, price.currency_code)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default WarehousePricingWidget
