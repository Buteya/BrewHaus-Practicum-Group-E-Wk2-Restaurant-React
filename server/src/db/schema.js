import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('user_email_unique').on(table.email)],
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('session_token_unique').on(table.token),
    index('session_user_id_index').on(table.userId),
  ],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
    index('account_user_id_index').on(table.userId),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('verification_identifier_index').on(table.identifier)],
)

export const menu = pgTable(
  'menu',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    categoryLabel: text('categoryLabel').notNull(),
    image: text('image').notNull(),
    description: text('description').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('KES'),
    preparation: text('preparation').notNull(),
    sides: text('sides').array().notNull(),
    recommendedDrinks: text('recommendedDrinks').array().notNull(),
  },
  (table) => [
    uniqueIndex('menu_slug_unique').on(table.slug),
    uniqueIndex('menu_name_unique').on(table.name),
    index('menu_category_index').on(table.category),
  ],
)

export const menuImage = pgTable(
  'menu_image',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menuId: uuid('menuId')
      .notNull()
      .references(() => menu.id, { onDelete: 'cascade' }),
    imageUrl: text('imageUrl').notNull(),
    altText: text('altText'),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    uniqueIndex('menu_image_menu_position_unique').on(
      table.menuId,
      table.position,
    ),
    index('menu_image_menu_id_index').on(table.menuId),
  ],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('userId').references(() => user.id, { onDelete: 'set null' }),
    stripeCheckoutSessionId: text('stripeCheckoutSessionId').notNull(),
    status: text('status').notNull().default('pending'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('KES'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('orders_stripe_checkout_session_unique').on(
      table.stripeCheckoutSessionId,
    ),
    index('orders_user_id_index').on(table.userId),
  ],
)

export const orderItems = pgTable(
  'orderitems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('orderId')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuId: uuid('menuId').references(() => menu.id, { onDelete: 'set null' }),
    itemName: text('itemName').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unitPrice', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    check('orderitems_quantity_positive', sql`${table.quantity} > 0`),
    index('orderitems_order_id_index').on(table.orderId),
    index('orderitems_menu_id_index').on(table.menuId),
  ],
)

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    reservationDate: text('reservationDate').notNull(),
    reservationTime: text('reservationTime').notNull(),
    partySize: integer('partySize').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default('requested'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    check('reservations_party_size_positive', sql`${table.partySize} > 0`),
    index('reservations_date_status_index').on(
      table.reservationDate,
      table.status,
    ),
  ],
)