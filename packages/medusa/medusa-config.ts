import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    // Body parser limit for /store/file-upload is set in src/api/middlewares.ts (10mb).
    // projectConfig.bodyParser is not used by Medusa's HTTP layer; per-route config is required.
  },
  modules: [
    {
      resolve: "./src/modules/warehouse-pricing",
    },
  ],
})
