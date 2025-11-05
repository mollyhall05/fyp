-- Enable the uuid-ossp extension if not exists
create extension if not exists "uuid-ossp" with schema extensions;

-- Create groups table
create table public.groups (
                               id uuid primary key default extensions.uuid_generate_v4(),
                               name text not null,
                               description text,
                               created_by uuid references auth.users(id) on delete set null,
                               created_at timestamptz default now() not null,
                               updated_at timestamptz default now() not null
);

-- Create group_members table
create table public.group_members (
                                      id uuid primary key default extensions.uuid_generate_v4(),
                                      group_id uuid references public.groups(id) on delete cascade not null,
                                      user_id uuid references auth.users(id) on delete cascade not null,
                                      is_admin boolean default false not null,
                                      created_at timestamptz default now() not null,
                                      unique(group_id, user_id)
);

-- Create study_sessions table
create table public.study_sessions (
                                       id uuid primary key default extensions.uuid_generate_v4(),
                                       group_id uuid references public.groups(id) on delete cascade not null,
                                       title text not null,
                                       description text,
                                       session_date timestamptz not null,
                                       created_at timestamptz default now() not null,
                                       updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.study_sessions enable row level security;

-- Create policies for groups
create policy "Users can view groups they are members of"
  on public.groups
  for select
                 using (
                 id in (
                 select group_id from public.group_members
                 where user_id = auth.uid()
                 )
                 );

create policy "Group creators can manage their groups"
  on public.groups
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Create policies for group_members
create policy "Users can view their group memberships"
  on public.group_members
  for select
                        using (user_id = auth.uid());

create policy "Group admins can manage members"
  on public.group_members
  for all
  using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and is_admin = true
    )
  )
  with check (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and is_admin = true
    )
  );

-- Create policies for study_sessions
create policy "Users can view their group's study sessions"
  on public.study_sessions
  for select
                        using (
                        group_id in (
                        select group_id from public.group_members
                        where user_id = auth.uid()
                        )
                        );

create policy "Group admins can insert study sessions"
  on public.study_sessions
  for insert
  with check (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and is_admin = true
    )
  );

-- Create a trigger function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
return new;
end;
$$ language plpgsql;

-- Create triggers for all tables that need updated_at
create trigger update_groups_updated_at
    before update on public.groups
    for each row
    execute function update_updated_at_column();

create trigger update_study_sessions_updated_at
    before update on public.study_sessions
    for each row
    execute function update_updated_at_column();