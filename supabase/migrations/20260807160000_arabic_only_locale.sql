-- ConvAudit / StorePulse is Arabic-only for product UI.
-- Coerce legacy English profile locales and plan labels to Arabic.

alter table public.profiles
  alter column locale set default 'ar';

update public.profiles
set locale = 'ar'
where locale is null
   or lower(locale) = 'en'
   or lower(locale) like 'en-%';

update public.plan_catalog
set display_name = case id
  when 'free' then 'مجاني'
  when 'pro' then 'احترافي'
  when 'business' then 'أعمال'
  else display_name
end
where id in ('free', 'pro', 'business');
