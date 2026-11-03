import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
export const staff = sqliteTable(
  'guide_staff',
  {
    userId: text('user_id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    role: text('role').notNull(),
    active: integer('active').notNull().default(1),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('guide_staff_email_idx').on(t.email),
    uniqueIndex('guide_staff_email_unique').on(sql`lower(${t.email})`),
  ],
);
export const invitations = sqliteTable('guide_invitations', {
  email: text('email').primaryKey(),
  role: text('role').notNull(),
  active: integer('active').notNull().default(1),
  invitedBy: text('invited_by').notNull(),
  createdAt: text('created_at').notNull(),
});
export const articles = sqliteTable(
  'guide_articles',
  {
    id: text('id').primaryKey(),
    draftJson: text('draft_json').notNull(),
    draftSummary: text('draft_summary').notNull(),
    publishedJson: text('published_json'),
    publishedSummary: text('published_summary'),
    status: text('status').notNull().default('draft'),
    revision: integer('revision').notNull().default(1),
    publishedRevision: integer('published_revision'),
    archived: integer('archived').notNull().default(0),
    reviewNote: text('review_note').notNull().default(''),
    updatedBy: text('updated_by').notNull(),
    updatedAt: text('updated_at').notNull(),
    publishedAt: text('published_at'),
  },
  (t) => [index('guide_articles_status_idx').on(t.status, t.archived)],
);
export const revisions = sqliteTable(
  'guide_revisions',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id),
    revision: integer('revision').notNull(),
    contentJson: text('content_json').notNull(),
    action: text('action').notNull(),
    actorId: text('actor_id').notNull(),
    note: text('note').notNull().default(''),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('guide_revision_article_idx').on(t.articleId, t.revision)],
);
export const media = sqliteTable('guide_media', {
  id: text('id').primaryKey(),
  objectKey: text('object_key').notNull(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull(),
  alt: text('alt').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: text('created_at').notNull(),
});
export const publicMedia = sqliteTable(
  'guide_public_media',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.mediaId] }),
    index('guide_public_media_lookup_idx').on(t.mediaId),
  ],
);
export const packs = sqliteTable('guide_packs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  activity: text('activity').notNull(),
  modulesJson: text('modules_json').notNull(),
  articleIdsJson: text('article_ids_json').notNull(),
  welcome: text('welcome').notNull(),
  archived: integer('archived').notNull().default(0),
  revision: integer('revision').notNull().default(1),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const feedback = sqliteTable(
  'guide_feedback',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id').notNull(),
    vote: text('vote').notNull(),
    comment: text('comment').notNull().default(''),
    visitorHash: text('visitor_hash').notNull(),
    voteDay: text('vote_day').notNull().default(''),
    resolved: integer('resolved').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    index('guide_feedback_article_idx').on(t.articleId, t.createdAt),
    uniqueIndex('guide_feedback_daily_unique').on(t.articleId, t.visitorHash, t.voteDay),
  ],
);
export const rateLimits = sqliteTable('guide_rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(1),
  expiresAt: integer('expires_at').notNull(),
});
export const audit = sqliteTable(
  'guide_audit',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    entityId: text('entity_id').notNull(),
    detail: text('detail').notNull().default(''),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('guide_audit_created_idx').on(t.createdAt)],
);
export const questions = sqliteTable('guide_questions', {
  id: text('id').primaryKey(),
  question: text('question').notNull(),
  activity: text('activity').notNull(),
  module: text('module').notNull(),
  source: text('source').notNull(),
  status: text('status').notNull().default('open'),
  frequency: integer('frequency').notNull().default(1),
  articleId: text('article_id'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const credentials = sqliteTable('guide_credentials', {
  userId: text('user_id')
    .primaryKey()
    .references(() => staff.userId),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  iterations: integer('iterations').notNull(),
  version: text('version').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const sessions = sqliteTable(
  'guide_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => staff.userId),
    credentialVersion: text('credential_version').notNull(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('guide_sessions_user_idx').on(t.userId)],
);
export const activationTokens = sqliteTable(
  'guide_activation_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => staff.userId),
    createdBy: text('created_by').notNull(),
    expiresAt: integer('expires_at').notNull(),
    consumedAt: integer('consumed_at'),
  },
  (t) => [index('guide_activation_user_idx').on(t.userId)],
);
