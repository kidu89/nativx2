-- 1. Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  tier text default 'free',
  credits int default 0,
  builds_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Create a trigger to auto-create profile on signup
-- This ensures every new user gets a 'free' profile with 0 credits immediately
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, tier, credits, builds_count)
  values (new.id, new.email, 'free', 0, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Create an RPC function to atomically decrement credits
-- This is called by the frontend (or backend) to "pay" for a build
create or replace function consume_credit()
returns boolean
language plpgsql
security definer
as $$
declare
  current_credits int;
begin
  -- Check current credits for the user
  select credits into current_credits
  from profiles
  where id = auth.uid();

  -- If user has credits, deduct 1 and increment build count
  if current_credits > 0 then
    update profiles
    set credits = credits - 1,
        builds_count = builds_count + 1
    where id = auth.uid();
    return true; -- Success
  else
    return false; -- Insufficient funds
  end if;
end;
$$;
