import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const groupRoleEnum = pgEnum('group_role', ['admin', 'member'])

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const familyGroups = pgTable('family_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const groupMembers = pgTable('group_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull().references(() => familyGroups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  role: groupRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull().references(() => familyGroups.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdBy: text('created_by').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at'),
  usesLeft: integer('uses_left'), // null = unlimited
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull().references(() => familyGroups.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id),
  caption: text('caption'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const postImages = pgTable('post_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  order: integer('order').notNull().default(0),
})

export const reactions = pgTable('reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  emoji: text('emoji').notNull(), // ❤️ 🥰 😂 👍
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const taggedMembers = pgTable('tagged_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type FamilyGroup = typeof familyGroups.$inferSelect
export type GroupMember = typeof groupMembers.$inferSelect
export type Post = typeof posts.$inferSelect
export type PostImage = typeof postImages.$inferSelect
export type Reaction = typeof reactions.$inferSelect
export type Comment = typeof comments.$inferSelect
