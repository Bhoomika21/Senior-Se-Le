-- ============================================
-- SENIOR SE LE — Database Schema (Phase 1)
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  college text,
  avatar_url text,
  rating_avg numeric(2,1) default 0,
  rating_count int default 0,
  is_banned boolean default false,
  created_at timestamptz default now()
);

-- Books table
create table books (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  author text,
  subject text,
  category text, -- Engineering, Commerce, Science, Medical, Arts
  description text,
  condition int not null check (condition between 1 and 5), -- 5=Like New ... 1=Heavily Used
  price numeric(10,2) not null,
  original_price numeric(10,2),
  images text[] default '{}', -- array of storage URLs
  video_url text, -- optional verification video, required if price >= 300
  status text default 'available' check (status in ('available', 'reserved', 'sold', 'removed')),
  created_at timestamptz default now()
);

-- Conversations (one per book between buyer & seller)
create table conversations (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade not null,
  buyer_id uuid references profiles(id) on delete cascade not null,
  seller_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(book_id, buyer_id)
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Ratings & reviews (both directions: buyer rates seller, seller rates buyer)
create table ratings (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade not null,
  rater_id uuid references profiles(id) on delete cascade not null,
  rated_user_id uuid references profiles(id) on delete cascade not null,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(book_id, rater_id)
);

-- Blocks (personal blocking, not visible to platform)
create table blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- Reports (sent to admin for review)
create table reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_user_id uuid references profiles(id) on delete cascade not null,
  reason text not null,
  proof_url text, -- screenshot upload
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'actioned')),
  admin_notes text,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table profiles enable row level security;
alter table books enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;

-- Profiles: anyone can view, only owner can update
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Books: anyone can view available books, only seller can edit/delete their own
create policy "Books are viewable by everyone" on books for select using (true);
create policy "Users can insert own books" on books for insert with check (auth.uid() = seller_id);
create policy "Sellers can update own books" on books for update using (auth.uid() = seller_id);
create policy "Sellers can delete own books" on books for delete using (auth.uid() = seller_id);

-- Conversations: only participants can view
create policy "Participants can view conversations" on conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can start conversations" on conversations for insert
  with check (auth.uid() = buyer_id);

-- Messages: only conversation participants can view/send
create policy "Participants can view messages" on messages for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
    )
  );
create policy "Participants can send messages" on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
    )
  );

-- Ratings: anyone can view, only the rater can insert (once per book)
create policy "Ratings are viewable by everyone" on ratings for select using (true);
create policy "Users can rate after transaction" on ratings for insert with check (auth.uid() = rater_id);

-- Blocks: only visible to the blocker
create policy "Users can view own blocks" on blocks for select using (auth.uid() = blocker_id);
create policy "Users can create blocks" on blocks for insert with check (auth.uid() = blocker_id);
create policy "Users can remove own blocks" on blocks for delete using (auth.uid() = blocker_id);

-- Reports: reporter can view own reports, anyone can insert
create policy "Users can view own reports" on reports for select using (auth.uid() = reporter_id);
create policy "Users can create reports" on reports for insert with check (auth.uid() = reporter_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, college)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'college'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FUNCTION: Update profile rating average after new rating
-- ============================================
create function public.update_profile_rating()
returns trigger as $$
begin
  update profiles
  set
    rating_avg = (select avg(stars)::numeric(2,1) from ratings where rated_user_id = new.rated_user_id),
    rating_count = (select count(*) from ratings where rated_user_id = new.rated_user_id)
  where id = new.rated_user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_rating_created
  after insert on ratings
  for each row execute procedure public.update_profile_rating();

-- ============================================
-- STORAGE BUCKETS (run separately in Storage section, or via API)
-- ============================================
-- Create these buckets manually in Supabase Dashboard → Storage:
-- 1. "book-images" (public)
-- 2. "report-proofs" (private)

-- ============================================
-- ENABLE REALTIME for chat messages
-- ============================================
alter publication supabase_realtime add table messages;

-- ============================================
-- FEEDBACK TABLE
-- ============================================
create table feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  user_email text,
  message text not null,
  created_at timestamptz default now()
);

alter table feedback enable row level security;
create policy "Users can submit feedback" on feedback for insert with check (true);
create policy "Users can view own feedback" on feedback for select using (auth.uid() = user_id);
