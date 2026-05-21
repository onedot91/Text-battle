-- 실제 장기 운영 시에는 교사용 관리자 인증, 학급 코드, 학생별 수정 제한 정책을 추가해야 합니다.

create extension if not exists pgcrypto;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  student_number integer not null check (student_number between 1 and 99),
  name text not null,
  ability_blank text not null,
  support1_blank text not null,
  support2_blank text not null,
  support3_blank text not null,
  is_representative boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.battle_records (
  id uuid primary key default gen_random_uuid(),
  character_a_id uuid references public.characters(id) on delete set null,
  character_b_id uuid references public.characters(id) on delete set null,
  winner_character_id uuid references public.characters(id) on delete set null,
  situation_id text not null,
  situation_text text not null,
  story text not null,
  reason text not null,
  evidence_topic_sentence text,
  evidence_support_sentence text,
  rewrite_tip text,
  created_at timestamptz default now()
);

create table if not exists public.rewrite_logs (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete set null,
  student_number integer not null check (student_number between 1 and 99),
  field_name text not null check (field_name in ('ability_blank', 'support1_blank', 'support2_blank', 'support3_blank')),
  before_text text not null,
  after_text text not null,
  created_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_characters_updated_at on public.characters;
create trigger set_characters_updated_at
before update on public.characters
for each row
execute function public.set_updated_at();

create unique index if not exists characters_one_representative_per_student
on public.characters (student_number)
where is_representative = true;

alter table public.characters enable row level security;
alter table public.battle_records enable row level security;
alter table public.rewrite_logs enable row level security;

drop policy if exists "MVP public characters select" on public.characters;
create policy "MVP public characters select"
on public.characters for select
using (true);

drop policy if exists "MVP public characters insert" on public.characters;
create policy "MVP public characters insert"
on public.characters for insert
with check (true);

drop policy if exists "MVP public characters update" on public.characters;
create policy "MVP public characters update"
on public.characters for update
using (true)
with check (true);

drop policy if exists "MVP public characters delete" on public.characters;
create policy "MVP public characters delete"
on public.characters for delete
using (true);

drop policy if exists "MVP public battle_records select" on public.battle_records;
create policy "MVP public battle_records select"
on public.battle_records for select
using (true);

drop policy if exists "MVP public battle_records insert" on public.battle_records;
create policy "MVP public battle_records insert"
on public.battle_records for insert
with check (true);

drop policy if exists "MVP public rewrite_logs select" on public.rewrite_logs;
create policy "MVP public rewrite_logs select"
on public.rewrite_logs for select
using (true);

drop policy if exists "MVP public rewrite_logs insert" on public.rewrite_logs;
create policy "MVP public rewrite_logs insert"
on public.rewrite_logs for insert
with check (true);
