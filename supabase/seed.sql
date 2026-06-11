-- Multicolor seed data (generated from the catalogue). Run AFTER schema.sql.
begin;

-- cat_groups
insert into cat_groups(id,name) values ('paint','საღებავები და ლაქები') on conflict (id) do nothing;
insert into cat_groups(id,name) values ('chem','სამშენებლო ქიმია') on conflict (id) do nothing;
insert into cat_groups(id,name) values ('tool','ინსტრუმენტი და აქსესუარები') on conflict (id) do nothing;

-- surfaces
insert into surfaces(id,name) values ('interior','ინტერიერი') on conflict (id) do nothing;
insert into surfaces(id,name) values ('facade','ფასადი') on conflict (id) do nothing;
insert into surfaces(id,name) values ('floor','იატაკი') on conflict (id) do nothing;
insert into surfaces(id,name) values ('roof','სახურავი') on conflict (id) do nothing;
insert into surfaces(id,name) values ('bathroom','სააბაზანო') on conflict (id) do nothing;
insert into surfaces(id,name) values ('metal','ლითონი') on conflict (id) do nothing;
insert into surfaces(id,name) values ('wood','ხე') on conflict (id) do nothing;
insert into surfaces(id,name) values ('concrete','ბეტონი') on conflict (id) do nothing;

-- brands
insert into brands(id,name,country,tint,tagline,story) values ('sobsan','Sobsan','თურქეთი','#2f4bc7','საღებავები და ლაქები 1974 წლიდან','Sobsan-ი თურქეთის ერთ-ერთი უმსხვილესი საღებავების მწარმოებელია. წყალემულსიური და სილიკონის საღებავები, ლაქები და გრუნტები — ევროპული სტანდარტის რეცეპტურით და სტაბილური ხარისხით.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('premium','Premium','თურქეთი','#b3541e','სამონტაჟო ქაფი და ჰერმეტიკები','Premium-ის ქაფი, სილიკონი და MS-პოლიმერული წებოები პროფესიონალი მემონტაჟეების პირველი არჩევანია — სტაბილური გამოსავალი, ზუსტი დოზირება და მდგრადობა ნებისმიერ სეზონზე.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('starbond','Starbond','თურქეთი','#1e7a52','წებო და ბიტუმის იზოლაცია','Starbond-ი სპეციალიზებულია სამშენებლო წებოებსა და ბიტუმის ჰიდროიზოლაციაზე. PVA-დან ეპოქსიდამდე — შეკავშირება, რომელსაც ენდობი.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('bauer','Bauer','საბერძნეთი','#3a3f8f','სამშენებლო ქიმია საბერძნეთიდან','Bauer-ის ცემენტის ჰიდროიზოლაცია, ფუგები და გრუნტები ათწლეულებია გამოიყენება ხმელთაშუა ზღვის რეგიონის რთულ კლიმატში — ტენი, მზე და მარილიანი ჰაერი მისთვის ჩვეული გარემოა.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('teirani','Teirani','ირანი','#8f2d3a','აეროზოლის საღებავები RAL პალიტრით','Teirani-ის აეროზოლები სრულ RAL პალიტრას ფარავს — სითბომედეგი, ფლუორესცენტული და ანტიკოროზიული სერიებით. თანაბარი დაფარვა პირველივე შესხურებიდან.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('asmako','Asmako','თურქეთი','#46698c','ლენტები, ფუნჯები, ლილვაკები','Asmako ამზადებს სამღებრო ინსტრუმენტს — ფუნჯებს, ლილვაკებსა და ლენტებს, რომელთა ხარისხსაც ნახატზე ხედავ: თანაბარი კვალი, მინიმალური წვეთვა, სუფთა კიდეები.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('stargil','Stargil','თურქეთი','#7a5a2f','გამხსნელები და 24 ფერის კოლორანტი','Stargil-ის გამხსნელები და კოლორანტები საღებავის სამუშაოს ქიმიური საფუძველია — სუფთა შემადგენლობა, ზუსტი მარკირება და სტაბილური ფერი პარტიიდან პარტიამდე.') on conflict (id) do nothing;
insert into brands(id,name,country,tint,tagline,story) values ('proian','Projahn','გერმანია','#444a52','ბურღები, თავაკები, ხელსაწყოები','Projahn-ის საბურღი და საჭრელი ინსტრუმენტი პროფესიონალური კლასისაა — HSS-G ფოლადიდან SDS-MAX-მდე, ქარხნული კალიბრაციით და ხანგრძლივი რესურსით.') on conflict (id) do nothing;


-- categories (nested tree)
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('paints','ლაქ-საღებავები',NULL,NULL,ARRAY['size','color','surface']::text[],1,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('synthetic-lacquer','სინთეთიკური ლაქი','paints',NULL,ARRAY['size','color','surface']::text[],2,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('cellulose-lacquer','ცელულოზური ლაქი','paints',NULL,ARRAY['size','color','surface']::text[],3,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('colored-synthetic-lacquer','ფერადი სინთეთიკური ლაქი','paints',NULL,ARRAY['size','color','surface']::text[],4,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('synthetic-paint','სინთეთიკური საღებავი','paints',NULL,ARRAY['size','color','surface']::text[],5,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('cellulose-paint','ცელულოზური საღებავი','paints',NULL,ARRAY['size','color','surface']::text[],6,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('anticorrosion-paint','ანტიკოროზიული საღებავი','paints',NULL,ARRAY['size','color','surface']::text[],7,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('water-emulsion-paint','წყალემულსიური საღებავი','paints',NULL,ARRAY['size','color','surface']::text[],8,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('solvent','გამხსნელი','paints',NULL,ARRAY['size','color']::text[],9,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('primer','პრაიმერი','paints',NULL,ARRAY['size','color','surface']::text[],10,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('tools','ინსტრუმენტები',NULL,NULL,ARRAY['size','color','surface']::text[],11,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('drills','ბურღები','tools',NULL,ARRAY['size','color','surface']::text[],12,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('metal-drills','რკინის ბურღები','drills',NULL,ARRAY['size','color','surface']::text[],13,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('wood-drills','ხის ბურღები','drills',NULL,ARRAY['size','color','surface']::text[],14,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('concrete-drills','ბეტონის ბურღები','drills',NULL,ARRAY['size','color','surface']::text[],15,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('drill-bits','თავაკები','tools',NULL,ARRAY['size','color','surface']::text[],16,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('saws','ხერხები','tools',NULL,ARRAY['size','color','surface']::text[],17,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('metal-saws','რკინის ხერხები','saws',NULL,ARRAY['size','color','surface']::text[],18,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('wood-saws','ხის ხერხები','saws',NULL,ARRAY['size','color','surface']::text[],19,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('threaders','შიდა და გარე ხრახნმჭრელები','tools',NULL,ARRAY['size','color','surface']::text[],20,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('paint-rollers','სამღებვრო ლილვაკები','tools',NULL,ARRAY['size','color','surface']::text[],21,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('paint-brushes','სამღებვრო ჩოთქები','tools',NULL,ARRAY['size','color','surface']::text[],22,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('other-accessories','სხვა აქსესუარები','tools',NULL,ARRAY['size','color','surface']::text[],23,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('waterproofing','ჰიდროიზოლაცია',NULL,NULL,ARRAY['size','color','surface']::text[],24,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('aerosols','აეროზოლები',NULL,NULL,ARRAY['size','color','surface']::text[],25,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('glues-tapes','წებოები & სკოჩები',NULL,NULL,ARRAY['size','color','surface']::text[],26,NULL) on conflict (id) do nothing;
insert into categories(id,name,parent_id,"group",facets,"order",sub) values ('foam-silicone','ქაფ-სილიკონები',NULL,NULL,ARRAY['size','color','surface']::text[],27,NULL) on conflict (id) do nothing;

-- products / promotions / bundles intentionally empty (managed in admin)

-- hero_slides
insert into hero_slides(id,kicker,title,sub,cta,link,tint,"order") values ('h1','სეზონის შეთავაზება','ფასდაკლება საღებავებზე —20%-მდე','Sobsan-ის ინტერიერის სერია და კარ-ფანჯრის ლაქები — მხოლოდ ივნისში.','იხილე შეთავაზებები','sale.html','paint',0) on conflict (id) do nothing;
insert into hero_slides(id,kicker,title,sub,cta,link,tint,"order") values ('h2','ფერი შენთვის','შენი ფერი. შენი სივრცე.','24 კოლორანტი და სრული RAL პალიტრა — შეურიეთ ზუსტად ის ტონი, რომელიც გესახებათ.','ფერების კატალოგი','shop.html?cat=solvents','color',1) on conflict (id) do nothing;
insert into hero_slides(id,kicker,title,sub,cta,link,tint,"order") values ('h3','პროფესიონალებს','ბითუმად ფასები ობიექტებისთვის','ხელშეკრულება, პირადი მენეჯერი და მიწოდება ობიექტზე — მოითხოვეთ შეთავაზება.','მოითხოვე შეთავაზება','contact.html?type=bulk','pro',2) on conflict (id) do nothing;

-- seed orders / inquiries
insert into orders(id,type,status,created_at,customer,items) values ('MC-1042','order','new','2026-06-08T14:22:00','{"name":"გიორგი მაისურაძე","phone":"+995 599 12 34 56","city":"თბილისი","address":"ვაჟა-ფშაველას 71"}'::jsonb,'[{"pid":"sobplastik-int","size":"10კგ","color":"თეთრი","qty":2},{"pid":"roller-poly18","size":"25სმ","qty":1},{"pid":"tape-masking","size":"38მმ","qty":3}]'::jsonb) on conflict (id) do nothing;
insert into orders(id,type,status,created_at,customer,items) values ('MC-1041','quote','processing','2026-06-08T10:05:00','{"name":"შპს „მშენებელი 2020“","phone":"+995 577 44 55 66","city":"ბათუმი","company":"შპს მშენებელი 2020","note":"გვჭირდება ფასადის საღებავი ~400მ² ობიექტისთვის, ივლისის დასაწყისში."}'::jsonb,'[{"pid":"sobsil-facade","size":"15ლტ","qty":12},{"pid":"primer-deep","size":"10ლტ","qty":6}]'::jsonb) on conflict (id) do nothing;
insert into orders(id,type,status,created_at,customer,items) values ('MC-1040','order','done','2026-06-07T16:48:00','{"name":"ნინო ბერიძე","phone":"+995 555 98 76 54","city":"თბილისი","address":"ჭავჭავაძის 24ბ"}'::jsonb,'[{"pid":"grout-epoxy","size":"2კგ","color":"ანთრაციტი","qty":1},{"pid":"seal-sanitary","size":"280მლ","color":"გამჭვირვალე","qty":2}]'::jsonb) on conflict (id) do nothing;
insert into orders(id,type,status,created_at,customer,items) values ('MC-1039','order','processing','2026-06-07T11:30:00','{"name":"ლევან კვარაცხელია","phone":"+995 593 11 22 33","city":"ქუთაისი","address":"წერეთლის 88"}'::jsonb,'[{"pid":"drill-sdsplus","size":"8×160მმ","qty":5},{"pid":"bit-set32","size":"32 ცალი","qty":1},{"pid":"foam-pro65","size":"850მლ","qty":4}]'::jsonb) on conflict (id) do nothing;
insert into orders(id,type,status,created_at,customer,items) values ('MC-1038','quote','new','2026-06-06T09:15:00','{"name":"თემურ ჩხეიძე","phone":"+995 591 77 88 99","city":"რუსთავი","company":"ინდ. მეწარმე","note":"სახურავის ჰიდროიზოლაცია 250მ², მჭირდება კონსულტაციაც მასალაზე."}'::jsonb,'[{"pid":"hydro-pu","size":"25კგ","qty":3},{"pid":"tape-butyl","size":"10სმ","qty":8}]'::jsonb) on conflict (id) do nothing;

commit;
