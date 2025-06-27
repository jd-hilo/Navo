-- Create a function to delete a user's account
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete the user's auth account
  delete from auth.users where id = auth.uid();
end;
$$; 