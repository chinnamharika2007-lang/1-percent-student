-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  course text,
  goals_completed integer default 0,
  problems_solved integer default 0,
  focus_minutes integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date,
  platforms_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY GOALS TABLE
create table daily_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  category text,
  done boolean default false,
  date date default CURRENT_DATE not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FOCUS SESSIONS TABLE
create table focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  duration_minutes integer not null,
  mode text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SNIPPETS TABLE
create table snippets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  tag text,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ACHIEVEMENTS TABLE
create table achievements (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text not null,
  icon text not null,
  condition_type text not null,
  condition_value integer not null
);

-- USER ACHIEVEMENTS TABLE
create table user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id uuid references achievements(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- RLS POLICIES

-- Enable RLS
alter table profiles enable row level security;
alter table daily_goals enable row level security;
alter table focus_sessions enable row level security;
alter table snippets enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Daily Goals Policies
create policy "Users can view own goals" on daily_goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on daily_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on daily_goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on daily_goals for delete using (auth.uid() = user_id);

-- Focus Sessions Policies
create policy "Users can view own sessions" on focus_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on focus_sessions for insert with check (auth.uid() = user_id);

-- Snippets Policies
create policy "Users can view own snippets" on snippets for select using (auth.uid() = user_id);
create policy "Users can insert own snippets" on snippets for insert with check (auth.uid() = user_id);
create policy "Users can update own snippets" on snippets for update using (auth.uid() = user_id);
create policy "Users can delete own snippets" on snippets for delete using (auth.uid() = user_id);

-- Achievements Policies
create policy "Anyone can view achievements" on achievements for select to authenticated, anon using (true);

-- User Achievements Policies
create policy "Users can view own achievements" on user_achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- SEED ACHIEVEMENTS
insert into achievements (name, description, icon, condition_type, condition_value) values
('First Step', 'Complete your first daily goal.', '🥇', 'goals_completed', 1),
('7 Day Streak', 'Maintain a 7-day streak.', '🔥', 'streak', 7),
('Problem Solver', 'Complete 10 coding problems.', '💻', 'problems_solved', 10),
('Consistent Coder', 'Maintain a 30-day streak.', '🚀', 'streak', 30),
('Focus Master', 'Complete 10 Pomodoro sessions.', '⏱️', 'focus_sessions', 10),
('100 Goals', 'Complete 100 daily goals.', '🏆', 'goals_completed', 100);

-- Trigger to create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
