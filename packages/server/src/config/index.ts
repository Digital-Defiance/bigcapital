import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
// process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

module.exports = {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10),

  /**
   * System database configuration.
   */
  system: {
    db_client: process.env.SYSTEM_DB_CLIENT,
    db_host: process.env.SYSTEM_DB_HOST,
    db_user: process.env.SYSTEM_DB_USER,
    db_password: process.env.SYSTEM_DB_PASSWORD,
    db_name: process.env.SYSTEM_DB_NAME,
    charset: process.env.SYSTEM_DB_CHARSET,
    migrations_dir: process.env.SYSTEM_MIGRATIONS_DIR,
    seeds_dir: process.env.SYSTEM_SEEDS_DIR,
  },

  /**
   * Tenant database configuration.
   */
  tenant: {
    db_client: process.env.TENANT_DB_CLIENT,
    db_name_prefix: process.env.TENANT_DB_NAME_PERFIX,
    db_host: process.env.TENANT_DB_HOST,
    db_user: process.env.TENANT_DB_USER,
    db_password: process.env.TENANT_DB_PASSWORD,
    charset: process.env.TENANT_DB_CHARSET,
    migrations_dir: process.env.TENANT_MIGRATIONS_DIR,
    seeds_dir: process.env.TENANT_SEEDS_DIR,
  },

  /**
   * Databases manager config.
   */
  manager: {
    superUser: process.env.DB_MANAGER_SUPER_USER,
    superPassword: process.env.DB_MANAGER_SUPER_PASSWORD,
  },

  /**
   * Mail.
   */
  mail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: !!parseInt(process.env.MAIL_SECURE, 10),
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
  },

  /**
   * Mongo DB.
   */
  mongoDb: {
    /**
     * That long string from mlab
     */
    databaseURL: process.env.MONGODB_DATABASE_URL,
  },

  /**
   * Agenda
   */
  agenda: {
    dbCollection: process.env.AGENDA_DB_COLLECTION,
    pooltime: process.env.AGENDA_POOL_TIME,
    concurrency: parseInt(process.env.AGENDA_CONCURRENCY, 10),
  },

  /**
   * Agendash.
   */
  agendash: {
    user: process.env.AGENDASH_AUTH_USER,
    password: process.env.AGENDASH_AUTH_PASSWORD,
  },

  /**
   * Easy SMS gateway.
   */
  easySMSGateway: {
    api_key: process.env.EASY_SMS_TOKEN,
  },

  /**
   * JWT secret.
   */
  jwtSecret: process.env.JWT_SECRET,
  resetPasswordSeconds: 600,

  /**
   *
   */
  customerSuccess: {
    email: 'success@bigcapital.ly',
    phoneNumber: '(218) 92 791 8381',
  },

  baseURL: process.env.BASE_URL,

  /**
   * General API prefix.
   */
  api: {
    prefix: '/api',
  },

  /**
   * Licenses api basic authentication.
   */
  licensesAuth: {
    user: process.env.LICENSES_AUTH_USER,
    password: process.env.LICENSES_AUTH_PASSWORD,
  },

  /**
   * Redis storage configuration.
   */
  redis: {
    port: 6379,
  },

  /**
   * Throttler configuration.
   */
  throttler: {
    login: {
      points: 5,
      duration: 60 * 60 * 24 * 1, // Store number for 90 days since first fail
      blockDuration: 60 * 15,
    },
    requests: {
      points: 60,
      duration: 60,
      blockDuration: 60 * 10,
    },
  },

  /**
   * Users registeration configuration.
   */
  registration: {
    countries: {
      whitelist: ['LY'],
      blacklist: [],
    },
  },

  /**
   * Puppeteer remote browserless connection.
   */
  puppeteer: {
    browserWSEndpoint: process.env.BROWSER_WS_ENDPOINT,
  },

  protocol: '',
  hostname: '',
  scheduleComputeItemCost: 'in 5 seconds',

  /**
   * Latest tenant database batch number.
   *
   * Should increment the batch number once you create a new migrations or seeds
   * to application detarmines to upgrade.
   */
  databaseBatch: 4,
};