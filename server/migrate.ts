// Creates / updates all tables. Safe to run repeatedly: `npm run db:migrate`
import { getMigrations } from 'better-auth/db/migration';
import { auth } from './auth.js';
import { pool } from './db.js';

const APP_SCHEMA = `
create table if not exists user_plan (
  user_id    text not null references "user"(id) on delete cascade,
  deck_id    text not null,
  data       jsonb not null,
  updated_at bigint not null default 0,
  reset_at   bigint not null default 0,
  primary key (user_id, deck_id)
);

create table if not exists topic_progress (
  user_id      text not null references "user"(id) on delete cascade,
  deck_id      text not null,
  topic_id     text not null,
  status       text not null check (status in ('pending', 'done')),
  attempts     integer not null default 0,
  skips        integer not null default 0,
  last_rating  smallint check (last_rating between 1 and 3),
  completed_at bigint,
  manual       boolean not null default false,
  updated_at   bigint not null,
  primary key (user_id, deck_id, topic_id)
);

create table if not exists study_session (
  id         text primary key,
  user_id    text not null references "user"(id) on delete cascade,
  deck_id    text not null,
  topic_id   text not null,
  started_at bigint not null,
  ended_at   bigint not null,
  learn_sec  integer not null default 0,
  talk_sec   integer not null default 0,
  outcome    text not null check (outcome in ('completed', 'abandoned')),
  rating     smallint check (rating between 1 and 3),
  covered    integer not null default 0,
  total_asks integer not null default 0
);
create index if not exists study_session_user_idx on study_session (user_id, deck_id, started_at);
`;

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
console.log(`Auth tables: ${toBeCreated.length} to create, ${toBeAdded.length} to update`);
await runMigrations();
await pool.query(APP_SCHEMA);
const { rows } = await pool.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
console.log('Tables:', rows.map((r) => r.table_name).join(', '));
await pool.end();
