import { MedusaApp, Modules } from "@medusajs/framework/utils"

async function createPublishableKey() {
  const { container } = await MedusaApp({
    workingDirectory: process.cwd(),
  })

  try {
    const apiKeyModule = container.resolve(Modules.API_KEY)
    
    // Create a publishable API key
    const publishableKey = await apiKeyModule.createApiKeys({
      title: "Default Store Key",
      type: "publishable",
      created_by: "admin",
    })

    console.log("✅ Publishable API Key created successfully!")
    console.log("Key:", publishableKey.token)
    console.log("\nAdd this to your BFF .env file:")
    console.log(`MEDUSA_PUBLISHABLE_KEY=${publishableKey.token}`)
  } catch (error) {
    console.error("Failed to create publishable key:", error)
  }

  process.exit(0)
}

createPublishableKey()
