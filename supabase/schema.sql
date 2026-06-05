create extension if not exists pgcrypto;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  student_number integer not null,
  name text not null,
  subject_particle text not null default '는' check (subject_particle in ('은', '는')),
  ability_blank text not null,
  support1_blank text not null,
  support2_blank text not null,
  support3_blank text not null,
  is_representative boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.characters
  add column if not exists subject_particle text not null default '는';

alter table public.characters
  alter column subject_particle set default '는';

alter table public.characters
  drop constraint if exists characters_subject_particle_check;

alter table public.characters
  add constraint characters_subject_particle_check check (subject_particle in ('은', '는'));

create index if not exists characters_student_created_idx
  on public.characters (student_number, created_at);

create index if not exists characters_student_representative_idx
  on public.characters (student_number, is_representative, updated_at desc);

create unique index if not exists characters_one_representative_per_student_idx
  on public.characters (student_number)
  where is_representative;

create table if not exists public.battle_records (
  id uuid primary key default gen_random_uuid(),
  character_a_id uuid not null references public.characters(id) on delete cascade,
  character_b_id uuid not null references public.characters(id) on delete cascade,
  winner_character_id uuid not null references public.characters(id) on delete cascade,
  situation_id text not null,
  situation_text text not null,
  story text not null,
  reason text not null,
  evidence_topic_sentence text,
  evidence_support_sentence text,
  rewrite_tip text,
  created_at timestamptz not null default now()
);

create index if not exists battle_records_created_idx
  on public.battle_records (created_at desc);

create table if not exists public.character_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  student_number integer not null,
  deleted_character_id uuid not null,
  character_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists character_deletion_logs_student_created_idx
  on public.character_deletion_logs (student_number, created_at desc);

alter table public.characters enable row level security;
alter table public.battle_records enable row level security;
alter table public.character_deletion_logs enable row level security;

drop policy if exists "Public classroom access to characters" on public.characters;

create policy "Public classroom access to characters"
  on public.characters
  for all
  using (true)
  with check (true);

drop policy if exists "Public classroom access to battle records" on public.battle_records;

create policy "Public classroom access to battle records"
  on public.battle_records
  for all
  using (true)
  with check (true);

drop policy if exists "Public classroom access to character deletion logs" on public.character_deletion_logs;

create policy "Public classroom access to character deletion logs"
  on public.character_deletion_logs
  for all
  using (true)
  with check (true);

create or replace function public.set_representative_character(
  p_student_number integer,
  p_character_id uuid
)
returns public.characters
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_character public.characters;
begin
  if not exists (
    select 1
    from public.characters
    where id = p_character_id
      and student_number = p_student_number
  ) then
    raise exception 'Representative character not found.';
  end if;

  update public.characters
  set is_representative = false,
      updated_at = now()
  where student_number = p_student_number
    and is_representative = true;

  update public.characters
  set is_representative = true,
      updated_at = now()
  where id = p_character_id
  returning * into selected_character;

  return selected_character;
end;
$$;

grant execute on function public.set_representative_character(integer, uuid) to anon;
