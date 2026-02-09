import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// Helper function to check if an item has custom_design in metadata
function hasCustomDesign(item: any): boolean {
  if (!item) {
    return false;
  }
  
  // Check metadata - it might be directly on item or need parsing
  let metadata = item.metadata;
  
  if (!metadata) {
    return false;
  }
  
  // Handle metadata as object or string
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      return false;
    }
  }
  
  // Check if custom_design exists and is an object with required fields
  return (
    metadata &&
    typeof metadata === 'object' &&
    metadata.custom_design &&
    typeof metadata.custom_design === 'object' &&
    metadata.custom_design !== null &&
    (metadata.custom_design.file_id || metadata.custom_design.file_url)
  );
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { limit = 20, offset = 0 } = req.query;
  const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
  const offsetNum = parseInt(offset as string, 10) || 0;

  try {
    // Use order module service - try different service names
    let orderService: any = null;
    
    // Try different service names that might be available
    const serviceNames = [
      "orderModuleService",
      "orderService", 
      "order",
    ];
    
    for (const serviceName of serviceNames) {
      try {
        orderService = req.scope.resolve(serviceName);
        if (orderService) {
          console.log(`Using service: ${serviceName}`);
          break;
        }
      } catch (e) {
        // Try next service name
      }
    }
    
    if (!orderService) {
      throw new Error("Could not resolve order service");
    }

    // Fetch a larger batch to filter for custom designs
    const batchSize = Math.max(limitNum * 5, 100);
    const allOrders: any[] = []
    let currentOffset = offsetNum;
    let hasMore = true;
    const maxBatches = 10;
    let batchCount = 0;

    // Fetch orders in batches until we have enough with custom designs
    while (allOrders.length < limitNum && hasMore && batchCount < maxBatches) {
      batchCount++;
      
      try {
        // Try listOrders method
        let orders: any[] = [];
        
        if (typeof orderService.listOrders === 'function') {
          orders = await orderService.listOrders(
            {},
            {
              relations: ["items"],
              take: batchSize,
              skip: currentOffset,
            }
          );
        } else if (typeof orderService.list === 'function') {
          orders = await orderService.list(
            {},
            {
              relations: ["items"],
              take: batchSize,
              skip: currentOffset,
            }
          );
        } else {
          throw new Error("Order service doesn't have listOrders or list method");
        }
        
        if (!orders || orders.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Batch ${batchCount}: Fetched ${orders.length} orders`);

        // Debug: log first order to see structure
        if (batchCount === 1 && orders.length > 0) {
          const firstOrder = orders[0];
          console.log("=== RAW ORDER STRUCTURE ===");
          console.log("Order keys:", Object.keys(firstOrder));
          console.log("Order ID:", firstOrder.id);
          console.log("Order display_id:", firstOrder.display_id, typeof firstOrder.display_id);
          console.log("Order email:", firstOrder.email, typeof firstOrder.email);
          console.log("Order created_at:", firstOrder.created_at, typeof firstOrder.created_at);
          console.log("Order status:", firstOrder.status, typeof firstOrder.status);
          console.log("Order total:", firstOrder.total, typeof firstOrder.total);
          console.log("Order currency_code:", firstOrder.currency_code, typeof firstOrder.currency_code);
          console.log("Order items count:", firstOrder.items?.length || 0);
          
          if (firstOrder.items && firstOrder.items.length > 0) {
            const firstItem = firstOrder.items[0];
            console.log("First item ID:", firstItem.id);
            console.log("First item title:", firstItem.title);
            console.log("First item metadata exists?", !!firstItem.metadata);
            console.log("First item metadata type:", typeof firstItem.metadata);
            
            if (firstItem.metadata) {
              console.log("First item metadata keys:", Object.keys(firstItem.metadata));
              console.log("First item metadata.custom_design exists?", !!firstItem.metadata.custom_design);
              if (firstItem.metadata.custom_design) {
                console.log("First item custom_design:", JSON.stringify(firstItem.metadata.custom_design, null, 2));
              }
            }
            
            console.log("Has custom design?", hasCustomDesign(firstItem));
          } else {
            console.log("First order has no items!");
          }
          console.log("=== END RAW ORDER STRUCTURE ===");
        }

        // Filter orders that have items with custom_design in metadata
        const ordersWithDesign = orders.filter((order: any) => {
          if (!order.items || !Array.isArray(order.items)) {
            return false;
          }
          
          const hasDesign = order.items.some((item: any) => hasCustomDesign(item));
          if (hasDesign) {
            console.log(`✓ Order #${order.display_id} has custom design`);
          }
          return hasDesign;
        });
        
        console.log(`Batch ${batchCount}: ${ordersWithDesign.length} out of ${orders.length} orders have custom designs`);

        allOrders.push(...ordersWithDesign);
        currentOffset += batchSize;

        // If we got fewer results than requested, we've reached the end
        if (orders.length < batchSize) {
          hasMore = false;
        }
      } catch (serviceError: any) {
        console.error("Order service error:", serviceError?.message || serviceError);
        hasMore = false;
        break;
      }
    }
    
    console.log(`Total orders with custom designs found: ${allOrders.length}`);

    // Apply pagination
    const paginatedOrders = allOrders.slice(0, limitNum);
    
    // Fetch full order details for each order (since list only returns id and items)
    // Use the same orderService we resolved earlier
    const formattedOrders = await Promise.all(
      paginatedOrders.map(async (order: any) => {
        const itemsWithDesign = (order.items || []).filter((item: any) => hasCustomDesign(item));

        // Fetch full order details - try multiple approaches
        let fullOrder: any = null;
        
        // Try 1: Use orderService retrieve method
        try {
          if (orderService && typeof orderService.retrieve === 'function') {
            fullOrder = await orderService.retrieve(order.id);
            console.log(`Retrieved order ${order.id} via retrieve method`);
          } else if (orderService && typeof orderService.retrieveOrder === 'function') {
            fullOrder = await orderService.retrieveOrder(order.id);
            console.log(`Retrieved order ${order.id} via retrieveOrder method`);
          }
        } catch (retrieveError) {
          console.log(`Retrieve method failed for ${order.id}, trying query module`);
          
          // Try 2: Use query module with simple fields
          try {
            const query = req.scope.resolve("query");
            const result = await query.graph({
              entity: "order",
              fields: "id,display_id,email,created_at,status,total,currency_code",
              filters: {
                id: order.id,
              },
            });
            
            if (result?.data && result.data.length > 0) {
              fullOrder = result.data[0];
              console.log(`Fetched order ${order.id} via query module`);
            }
          } catch (queryError) {
            console.error(`Query module also failed for ${order.id}:`, queryError);
          }
        }
        
        if (fullOrder) {
          console.log(`Order ${order.id} details:`, {
            display_id: fullOrder.display_id,
            email: fullOrder.email,
            status: fullOrder.status,
            total: fullOrder.total,
            currency_code: fullOrder.currency_code,
          });
        }

        // Extract order fields from full order or fallback to defaults
        const orderId = order.id
        const displayId = fullOrder?.display_id || null
        const email = fullOrder?.email || fullOrder?.customer?.email || null
        const createdAt = fullOrder?.created_at || null
        const status = fullOrder?.status || 'pending'
        const total = fullOrder?.total !== undefined && fullOrder?.total !== null ? fullOrder.total : null
        const currencyCode = fullOrder?.currency_code || 'USD'

        return {
          id: orderId,
          display_id: displayId,
          email: email,
          created_at: createdAt,
          status: status,
          total: total,
          currency_code: currencyCode,
          items: itemsWithDesign.map((item: any) => {
            let metadata = item.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                metadata = {};
              }
            }
            
            return {
              id: item.id,
              title: item.title,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              product_title: metadata?.product_title,
              variant_title: metadata?.variant_title,
              custom_design: metadata?.custom_design,
            };
          }),
        };
      })
    );
    
    // Debug: log first formatted order
    if (formattedOrders.length > 0) {
      console.log("First formatted order:", JSON.stringify(formattedOrders[0], null, 2));
    }

    res.json({
      orders: formattedOrders,
      count: formattedOrders.length,
      offset: offsetNum,
      limit: limitNum,
      total: allOrders.length, // Approximate total
    });
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    // Return empty result on error with debug info
    res.status(500).json({
      orders: [],
      count: 0,
      offset: offsetNum,
      limit: limitNum,
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
