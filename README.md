# PostFlow — دليل الإعداد

## الملفات
```
postflow/
├── public/
│   └── index.html          ← الموقع الكامل
├── api/
│   └── oauth-callback.js   ← يستقبل تسجيل دخول Meta
├── vercel.json             ← إعدادات Vercel
└── README.md
```

---

## خطوات الرفع على Vercel

### 1. افتح index.html وعدّل السطور التالية:
```js
const SUPABASE_URL = 'https://xxxx.supabase.co';      // ← رابط Supabase
const SUPABASE_KEY = 'eyJ...';                         // ← Anon Key
const META_APP_ID  = '1307294064882711';               // ← App ID من Meta
```

### 2. في Vercel أضف Environment Variables:
```
META_APP_ID       = App ID من Meta
META_APP_SECRET   = App Secret من Meta (الجديد بعد التغيير)
NEXT_PUBLIC_BASE_URL = https://اسم-موقعك.vercel.app
```

### 3. في Supabase أنشئ جدول posts:
```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  caption text,
  video_name text,
  platforms text,
  status text,
  created_at timestamptz default now()
);
alter table posts enable row level security;
create policy "user posts" on posts
  for all using (auth.uid() = user_id);
```

### 4. في Meta Developer:
- أضف Redirect URI:
  `https://اسم-موقعك.vercel.app/api/oauth-callback?platform=instagram`
  `https://اسم-موقعك.vercel.app/api/oauth-callback?platform=facebook`

---

## كيف يعمل الموقع

1. المستخدم يسجل حساب (Supabase Auth)
2. يضغط "ربط Instagram" → يسجل دخول بحسابه
3. يرفع الفيديو + يكتب الكابشن
4. يضغط نشر → ينشر على إنستا وفيسبوك مباشرة
5. كل نشر يُحفظ في Supabase

---

## لإضافة TikTok لاحقاً
- سجّل على developers.tiktok.com
- احصل على Client Key
- أضف زر "ربط TikTok" في الكود
