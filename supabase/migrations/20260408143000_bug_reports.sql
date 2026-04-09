create table if not exists public.bug_reports (
  id bigserial primary key,
  reporter_user_id uuid null references auth.users (id) on delete set null,
  reporter_email_masked text null,
  message text not null,
  app_lang text null,
  page_url text null,
  created_at timestamptz not null default now(),
  constraint bug_reports_message_len_chk check (char_length(message) >= 8 and char_length(message) <= 4000)
);

create index if not exists bug_reports_created_at_idx on public.bug_reports (created_at desc);
create index if not exists bug_reports_reporter_user_id_idx on public.bug_reports (reporter_user_id);

alter table public.bug_reports enable row level security;
