import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, Label, Switch, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"

type PricingTier = {
  id: string
  warehouse_price_id: string
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

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

type TierFormData = {
  min_quantity: string
  max_quantity: string
  unit_price: string
}

const WarehousePricingWidget = ({ data }: { data: { id: string } }) => {
  const variantId = data.id
  const [prices, setPrices] = useState<WarehousePrice[]>([])
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [tiers, setTiers] = useState<Record<string, PricingTier[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedPrice, setExpandedPrice] = useState<string | null>(null)
  const [tierForm, setTierForm] = useState<TierFormData>({
    min_quantity: "",
    max_quantity: "",
    unit_price: "",
  })
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

      // Fetch tiers for each price
      const tiersMap: Record<string, PricingTier[]> = {}
      for (const price of pricesData.warehouse_prices || []) {
        const tiersRes = await fetch(`/admin/warehouse-prices/${price.id}/tiers`, {
          credentials: "include",
        })
        const tiersData = await tiersRes.json()
        tiersMap[price.id] = tiersData.pricing_tiers || []
      }
      setTiers(tiersMap)
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
          base_price: Math.round(parseFloat(formData.base_price) * 100),
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

  const handleAddTier = async (warehousePriceId: string) => {
    const existingTiers = tiers[warehousePriceId] || []
    const newTier = {
      min_quantity: parseInt(tierForm.min_quantity, 10),
      max_quantity: tierForm.max_quantity ? parseInt(tierForm.max_quantity, 10) : null,
      unit_price: Math.round(parseFloat(tierForm.unit_price) * 100),
    }

    const updatedTiers = [...existingTiers.map(t => ({
      min_quantity: t.min_quantity,
      max_quantity: t.max_quantity,
      unit_price: t.unit_price,
    })), newTier]

    try {
      const response = await fetch(`/admin/warehouse-prices/${warehousePriceId}/tiers`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tiers: updatedTiers }),
      })

      if (response.ok) {
        setTierForm({ min_quantity: "", max_quantity: "", unit_price: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to save tier:", error)
    }
  }

  const handleDeleteTier = async (warehousePriceId: string, tierIndex: number) => {
    const existingTiers = tiers[warehousePriceId] || []
    const updatedTiers = existingTiers
      .filter((_, idx) => idx !== tierIndex)
      .map(t => ({
        min_quantity: t.min_quantity,
        max_quantity: t.max_quantity,
        unit_price: t.unit_price,
      }))

    try {
      const response = await fetch(`/admin/warehouse-prices/${warehousePriceId}/tiers`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tiers: updatedTiers }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete tier:", error)
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

  const formatTierRange = (tier: PricingTier) => {
    if (tier.max_quantity === null) {
      return `${tier.min_quantity}+ units`
    }
    return `${tier.min_quantity}-${tier.max_quantity} units`
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
              <Label htmlFor="base_price">Base Price</Label>
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
        <div className="space-y-3">
          {prices.map((price) => {
            const priceTiers = tiers[price.id] || []
            const isExpanded = expandedPrice === price.id

            return (
              <div
                key={price.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Price Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedPrice(isExpanded ? null : price.id)}
                >
                  <div className="flex items-center gap-3">
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
                    {priceTiers.length > 0 && (
                      <Badge color="blue">{priceTiers.length} tier{priceTiers.length > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Text className="font-semibold">
                      {formatPrice(price.base_price, price.currency_code)}
                    </Text>
                    <Text className="text-gray-400">{isExpanded ? "▲" : "▼"}</Text>
                  </div>
                </div>

                {/* Expanded Tiers Section */}
                {isExpanded && (
                  <div className="p-4 border-t bg-white">
                    <div className="mb-3">
                      <Text className="font-medium text-sm mb-2">Quantity Pricing Tiers</Text>
                      <Text className="text-xs text-gray-500">
                        Base price applies when no tier matches. Add tiers for volume discounts.
                      </Text>
                    </div>

                    {/* Existing Tiers */}
                    {priceTiers.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {priceTiers.map((tier, idx) => (
                          <div
                            key={tier.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-4">
                              <Text className="text-sm font-medium">
                                {formatTierRange(tier)}
                              </Text>
                              <Text className="text-sm">
                                {formatPrice(tier.unit_price, price.currency_code)}/unit
                              </Text>
                            </div>
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => handleDeleteTier(price.id, idx)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Tier Form */}
                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label className="text-xs">Min Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tierForm.min_quantity}
                          onChange={(e) =>
                            setTierForm({ ...tierForm, min_quantity: e.target.value })
                          }
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Qty (empty = unlimited)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tierForm.max_quantity}
                          onChange={(e) =>
                            setTierForm({ ...tierForm, max_quantity: e.target.value })
                          }
                          placeholder="49"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={tierForm.unit_price}
                          onChange={(e) =>
                            setTierForm({ ...tierForm, unit_price: e.target.value })
                          }
                          placeholder="90.00"
                        />
                      </div>
                      <Button
                        size="small"
                        onClick={() => handleAddTier(price.id)}
                        disabled={!tierForm.min_quantity || !tierForm.unit_price}
                      >
                        Add Tier
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default WarehousePricingWidget
