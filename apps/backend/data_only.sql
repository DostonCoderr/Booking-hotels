--
-- PostgreSQL database dump
--

\restrict 2CRgES47LdKcbmHLy8gir7TLiosYGYPgi1JgMlkjizsX78xm0UNTIcA9fsWTOlY

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, password, name, avatar, phone, "isHost", "isVerified", "createdAt", "updatedAt", "stripeCustomerId", "telegramChatId", "isActive", role, "resetCode", "resetCodeExpiry", "clerkId") VALUES ('cmpa0n3pb0000scj873rbk8an', 'admin@airbnb.com', '$2b$12$NMPP7K.CEReFpzh95oBOXOpnZi42SJruqfwWeZT0z9DrQ9Hjqf9vG', 'Admin User', NULL, NULL, true, true, '2026-05-17 16:55:08.159', '2026-05-17 16:55:08.159', NULL, NULL, true, 'USER', NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, name, avatar, phone, "isHost", "isVerified", "createdAt", "updatedAt", "stripeCustomerId", "telegramChatId", "isActive", role, "resetCode", "resetCodeExpiry", "clerkId") VALUES ('cmpa0n3qt0001scj8wyz24vwl', 'user@airbnb.com', '$2b$12$NMPP7K.CEReFpzh95oBOXOpnZi42SJruqfwWeZT0z9DrQ9Hjqf9vG', 'Test User', NULL, NULL, false, true, '2026-05-17 16:55:08.213', '2026-05-17 16:55:08.213', NULL, NULL, true, 'USER', NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, name, avatar, phone, "isHost", "isVerified", "createdAt", "updatedAt", "stripeCustomerId", "telegramChatId", "isActive", role, "resetCode", "resetCodeExpiry", "clerkId") VALUES ('cmpa0zg1f0000scdytany6uzl', 'doston@test.com', '$2b$12$DwuED.vr9KGFhkpZQ0VjGOBRNkxppCLWGawO7PH9bFmwt4N0WdU46', 'Doston', NULL, NULL, false, false, '2026-05-17 17:04:44.02', '2026-05-17 17:04:44.02', NULL, NULL, true, 'USER', NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, name, avatar, phone, "isHost", "isVerified", "createdAt", "updatedAt", "stripeCustomerId", "telegramChatId", "isActive", role, "resetCode", "resetCodeExpiry", "clerkId") VALUES ('1', 'admin@example.com', '$2b$12$/q1fqqLI3aJt3QLx7LYmquKEvj8uMsVv3RrwC4COd63Tb.FJLsuye', 'Admin', NULL, NULL, false, true, '2026-05-27 17:45:22.024', '2026-05-27 17:41:22.107', NULL, NULL, true, 'ADMIN', NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, name, avatar, phone, "isHost", "isVerified", "createdAt", "updatedAt", "stripeCustomerId", "telegramChatId", "isActive", role, "resetCode", "resetCodeExpiry", "clerkId") VALUES ('cmpqv5e5g0000scw97msx3n9e', 'doston26061@gmail.com', '$2b$12$FOgjQIYWRIS9zfFhV35CSupjFkMAik//YgiiaFOtoZUhAO4FG87EG', 'Dostonbek', NULL, NULL, false, false, '2026-05-29 11:53:28.804', '2026-05-29 12:12:01.911', NULL, NULL, true, 'HOST', NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, name, avatar, phone, "isHost", "isVerified", "createdAt", "updatedAt", "stripeCustomerId", "telegramChatId", "isActive", role, "resetCode", "resetCodeExpiry", "clerkId") VALUES ('cmpa3hvv50000scr01mjfohre', 'test@test.com', '$2b$12$YELnWOm35hHlZUtxAUjtDe.GXdOWAw2H/QZpKbE.KKP/yOQCfXrye', 'Tets', NULL, NULL, true, true, '2026-05-17 18:15:03.569', '2026-05-29 17:43:44.424', 'cus_UZ4mvAqlw5mAW5', '5480822681', true, 'USER', NULL, NULL, NULL);


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpk3renf0003scco5mozi7ny', 'cmpa3hvv50000scr01mjfohre', '✈️ Sayohat boshlanadi!', 'Hurmatli mehmon, bugun "Toshkent markazidagi zamonaviy kvartira" da sayohatingiz boshlanadi. Yaxshi dam oling!', 'booking', '{"bookingId": "cmpk3nq2q0001sccoluzjoe9u", "daysUntil": 0}', true, '2026-05-24 18:20:09.579', '2026-05-24 18:20:54.359');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmplkzxrb0005sc2fhr6tdi6z', 'cmpa3hvv50000scr01mjfohre', 'Yangi xabar', 'Sizga yangi xabar keldi', 'message', '{"senderId": "cmpa3hvv50000scr01mjfohre", "messageId": "cmplkzxlc0003sc2fawnswmv2"}', true, '2026-05-25 19:10:27.239', '2026-05-27 18:31:39.012');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpqv94bn0002scw9zn0nwmc6', 'cmpqv5e5g0000scw97msx3n9e', 'Yangi Host so''rovi', 'Dostonbek host bo''lishni so''rayapti', 'host_request', '{"userId": "cmpqv5e5g0000scw97msx3n9e"}', true, '2026-05-29 11:56:22.692', '2026-05-29 12:12:01.989');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpqvt94m0001scizgfr3isid', 'cmpqv5e5g0000scw97msx3n9e', 'Tabriklaymiz! 🎉', 'Sizning host so''rovingiz tasdiqlandi. Endi listinglar qo''sha olasiz.', 'host_approved', NULL, false, '2026-05-29 12:12:02.039', '2026-05-29 12:12:02.039');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpodbjsj0001scca8epuutwk', 'cmpa3hvv50000scr01mjfohre', 'Listing tasdiqlandi!', 'Sizning "Toshkent markazidagi zamonaviy kvartira" listing-ingiz tasdiqlandi va endi foydalanuvchilarga ko''rinadi.', 'listing_approved', '{"listingId": "1"}', true, '2026-05-27 17:58:50.611', '2026-05-29 13:17:45.353');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpr00cxz0003scem0uj77tc3', 'cmpqv5e5g0000scw97msx3n9e', 'Yangi xabar', 'Sizga yangi xabar keldi', 'message', '{"senderId": "cmpa3hvv50000scr01mjfohre", "messageId": "cmpr00cur0001scem2piug8vg"}', false, '2026-05-29 14:09:32.039', '2026-05-29 14:09:32.039');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpqx9rq00005sczmzahfotrl', 'cmpqv5e5g0000scw97msx3n9e', 'Listing tasdiqlandi!', 'Sizning "Toshkent dagi zamonaviy  turar joy" listing-ingiz tasdiqlandi va endi foydalanuvchilarga ko''rinadi.', 'listing_approved', '{"listingId": "cmpqx79ga0001sczmts815xgb"}', true, '2026-05-29 12:52:52.248', '2026-05-29 15:27:26.601');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpqx79j50003sczm99usv4eh', '1', 'Yangi listing qo''shildi', 'undefined yangi listing qo''shdi: Toshkent dagi zamonaviy  turar joy', 'new_listing', '{"hostId": "cmpqv5e5g0000scw97msx3n9e", "listingId": "cmpqx79ga0001sczmts815xgb"}', true, '2026-05-29 12:50:55.361', '2026-05-29 17:21:09.213');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpr6f1rx0003scrxm7bbte6b', '1', 'Yangi listing qo''shildi', 'undefined yangi listing qo''shdi: Plyajdagi zamonaviy villa', 'new_listing', '{"hostId": "cmpqv5e5g0000scw97msx3n9e", "listingId": "cmpr6f1pq0001scrxpvz7qelh"}', true, '2026-05-29 17:08:55.101', '2026-05-29 17:21:09.213');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpr6nas60007scrxn2p7sofq', '1', 'Yangi listing qo''shildi', 'undefined yangi listing qo''shdi: Osmondagi tinchlik', 'new_listing', '{"hostId": "cmpqv5e5g0000scw97msx3n9e", "listingId": "cmpr6nar10005scrx9x0j2kco"}', true, '2026-05-29 17:15:20.022', '2026-05-29 17:21:09.213');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpr6pz5z0009scrxxm6k7nuy', 'cmpqv5e5g0000scw97msx3n9e', 'Listing tasdiqlandi!', 'Sizning "Osmondagi tinchlik" listing-ingiz tasdiqlandi va endi foydalanuvchilarga ko''rinadi.', 'listing_approved', '{"listingId": "cmpr6nar10005scrx9x0j2kco"}', true, '2026-05-29 17:17:24.935', '2026-05-29 17:23:51.983');
INSERT INTO public."Notification" (id, "userId", title, message, type, data, "isRead", "createdAt", "updatedAt") VALUES ('cmpr6ueke000bscrxgceqtxth', 'cmpqv5e5g0000scw97msx3n9e', 'Listing rad etildi', 'Sizning "Plyajdagi zamonaviy villa" listing-ingiz rad etildi. Sabab: 📝 Ma''lumotlar to''liq emas', 'listing_rejected', '{"reason": "📝 Ma''lumotlar to''liq emas", "listingId": "cmpr6f1pq0001scrxpvz7qelh"}', true, '2026-05-29 17:20:51.518', '2026-05-29 17:24:07.291');


--
-- Data for Name: PaymentMethod; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.listings (id, title, description, price, category, type, address, city, country, latitude, longitude, "maxGuests", bedrooms, beds, bathrooms, images, amenities, "isActive", "hostId", "createdAt", "updatedAt", "rejectReason", status) VALUES ('cmpr6nar10005scrx9x0j2kco', 'Osmondagi tinchlik', 'Hamam sharoiti bor', 500, 'unique', 'entire', 'Алмазарский район, Ташкент, Tashkent', 'Ташкент', 'Узбекистан', 41.3589705, 69.21772279999999, 1, 1, 1, 1, '{https://res.cloudinary.com/dewhwjbdr/image/upload/v1780074884/airbnb-clone/listings/hyqiffg1f8kp182f9e6z.jpg,https://res.cloudinary.com/dewhwjbdr/image/upload/v1780074887/airbnb-clone/listings/eb5tyuizt1nzuhwklk8v.jpg,https://res.cloudinary.com/dewhwjbdr/image/upload/v1780074889/airbnb-clone/listings/zob8ks9rruj6uknjigj2.jpg}', '{Basseyn,WiFi,Oshxona,"Bepul parking",Konditsioner,Nonushta,Lift,"Kir yuvish mashinasi",Gym,TV,Hovli,Balkon}', true, 'cmpqv5e5g0000scw97msx3n9e', '2026-05-29 17:15:19.98', '2026-05-29 17:17:24.897', NULL, 'APPROVED');
INSERT INTO public.listings (id, title, description, price, category, type, address, city, country, latitude, longitude, "maxGuests", bedrooms, beds, bathrooms, images, amenities, "isActive", "hostId", "createdAt", "updatedAt", "rejectReason", status) VALUES ('cmpr6f1pq0001scrxpvz7qelh', 'Plyajdagi zamonaviy villa', 'Dengiz qirgogida joylashgan ajoyib zamonaviy villa ', 250, 'beach', 'entire', 'Bochka', 'Toshkent viloyat', 'Uzbekistan', 41.2995, 69.2401, 1, 5, 1, 6, '{https://res.cloudinary.com/dewhwjbdr/image/upload/v1780074365/airbnb-clone/listings/kzvimqyn4x4kd4fecais.jpg,https://res.cloudinary.com/dewhwjbdr/image/upload/v1780074372/airbnb-clone/listings/fdhbj00rnp3x2qo6gdf3.jpg,https://res.cloudinary.com/dewhwjbdr/image/upload/v1780074421/airbnb-clone/listings/jeagphgpfjq6mu6624vm.jpg}', '{Basseyn,Konditsioner,"Kir yuvish mashinasi",Gym,Nonushta,Lift,TV,"Bepul parking",WiFi}', true, 'cmpqv5e5g0000scw97msx3n9e', '2026-05-29 17:08:55.021', '2026-05-29 17:20:51.481', '📝 Ma''lumotlar to''liq emas', 'REJECTED');
INSERT INTO public.listings (id, title, description, price, category, type, address, city, country, latitude, longitude, "maxGuests", bedrooms, beds, bathrooms, images, amenities, "isActive", "hostId", "createdAt", "updatedAt", "rejectReason", status) VALUES ('1', 'Toshkent markazidagi zamonaviy kvartira', 'Shahar markazida, metroga yaqin, zamonaviy jihozlangan kvartira. Wi-Fi, konditsioner, to''liq oshxona mavjud.', 85, 'apartment', 'entire', 'Amir Temur shoh ko''chasi, 15', 'Toshkent', 'O''zbekiston', 41.2995, 69.2401, 4, 3, 3, 3, '{https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800,https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800,""}', '{wifi,kitchen,ac,heating,washer,tv}', true, 'cmpa3hvv50000scr01mjfohre', '2026-05-24 17:26:05.351', '2026-05-27 17:58:50.549', NULL, 'APPROVED');
INSERT INTO public.listings (id, title, description, price, category, type, address, city, country, latitude, longitude, "maxGuests", bedrooms, beds, bathrooms, images, amenities, "isActive", "hostId", "createdAt", "updatedAt", "rejectReason", status) VALUES ('cmpqx79ga0001sczmts815xgb', 'Toshkent dagi zamonaviy  turar joy', 'Shaxar markazida joylashgan yangi tamirlangan barcha qulaylikalr bor ', 95, 'villa', 'entire', 'Yakkasaroy tuman, ', 'Tashkent ', 'Uzbekistan', 41.2995, 69.2401, 5, 2, 1, 18, '{https://res.cloudinary.com/dewhwjbdr/image/upload/v1780058821/airbnb-clone/listings/lmvy3sc2i359obim9zdq.jpg,https://res.cloudinary.com/dewhwjbdr/image/upload/v1780058835/airbnb-clone/listings/l7oyzyhi0jdjecrtz6ff.jpg,https://res.cloudinary.com/dewhwjbdr/image/upload/v1780058854/airbnb-clone/listings/sgxorefa2olmzpqjwxsy.jpg}', '{WiFi,Basseyn,Oshxona,"Bepul parking",Konditsioner,"Kir yuvish mashinasi",Nonushta,TV,Lift,Gym,Balkon,Hovli}', true, 'cmpqv5e5g0000scw97msx3n9e', '2026-05-29 12:50:55.258', '2026-05-29 12:52:52.209', NULL, 'APPROVED');


--
-- Data for Name: Wishlist; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Wishlist" (id, "userId", "listingId", "createdAt", "updatedAt") VALUES ('cmpll1oku0007sc2fekmqc1ne', 'cmpa3hvv50000scr01mjfohre', '1', '2026-05-25 19:11:48.654', '2026-05-25 19:11:48.654');
INSERT INTO public."Wishlist" (id, "userId", "listingId", "createdAt", "updatedAt") VALUES ('cmpr04lin0007scem47hdg3oe', 'cmpa3hvv50000scr01mjfohre', 'cmpqx79ga0001sczmts815xgb', '2026-05-29 14:12:49.775', '2026-05-29 14:12:49.775');


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('aa052342-59bd-4bd9-b8ea-b383176fba76', '6f009f418015c3548820ac8069b8c65565fa42d700e644cfc0e9071a14bdcd15', '2026-05-17 16:52:36.715567+00', '20260517165234_init', NULL, NULL, '2026-05-17 16:52:35.898738+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8af3da7c-e27d-4886-ba8f-16d02f55afae', 'e11810862cdb0e573c373e81cb99beac53e539aeebbd0bc41081b5289c37b1dc', '2026-05-20 16:15:28.248639+00', '20260520161527_add_wishlist', NULL, NULL, '2026-05-20 16:15:27.250266+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('da2f09bf-b91c-4066-866c-4cf4184c15f8', 'b323685fd377e36e7bf313717d98f0a569f126768cd9b436fce95a13f80767bb', '2026-05-20 16:30:40.622807+00', '20260520163040_add_notifications', NULL, NULL, '2026-05-20 16:30:40.103546+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8cb2fc6c-7fb0-4aff-afd6-e575d25cf3b8', '1bbc85738394a7bce9f9d2f85fd4b33f640534a968ad0b89d289e6a6fe6c6925', '2026-05-22 17:05:30.108068+00', '20260522170529_add_payment_methods', NULL, NULL, '2026-05-22 17:05:29.12992+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('299e64c8-20cc-4487-8f3e-21fe40d72897', '59a7d131538187d7691df210289390e7da0eab2f7f6510282655631d855172a7', '2026-05-22 17:58:54.657307+00', '20260522175854_add_telegram_chat_id', NULL, NULL, '2026-05-22 17:58:54.309853+00', 1);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.bookings (id, "checkIn", "checkOut", guests, "totalPrice", status, "stripePaymentId", "listingId", "guestId", "createdAt") VALUES ('cmpk3nq2q0001sccoluzjoe9u', '2026-05-23 19:00:00', '2026-05-24 19:00:00', 1, 85, 'confirmed', 'pi_3TagZrG1KHOI96vc0nbg9Re2', '1', 'cmpa3hvv50000scr01mjfohre', '2026-05-24 18:17:17.762');
INSERT INTO public.bookings (id, "checkIn", "checkOut", guests, "totalPrice", status, "stripePaymentId", "listingId", "guestId", "createdAt") VALUES ('cmpk3tugy0005sccoxp7y30k7', '2026-05-26 19:00:00', '2026-05-27 19:00:00', 1, 85, 'confirmed', 'pi_3TagefG1KHOI96vc1ZRxwIwn', '1', 'cmpa3hvv50000scr01mjfohre', '2026-05-24 18:22:03.394');
INSERT INTO public.bookings (id, "checkIn", "checkOut", guests, "totalPrice", status, "stripePaymentId", "listingId", "guestId", "createdAt") VALUES ('cmpk3wana0007sccopgna4wge', '2026-05-29 19:00:00', '2026-05-31 19:00:00', 1, 170, 'confirmed', 'pi_3TaggFG1KHOI96vc0to0VYBw', '1', 'cmpa3hvv50000scr01mjfohre', '2026-05-24 18:23:57.67');
INSERT INTO public.bookings (id, "checkIn", "checkOut", guests, "totalPrice", status, "stripePaymentId", "listingId", "guestId", "createdAt") VALUES ('cmpr05xzv0009scemxxjc4nz1', '2026-05-28 19:00:00', '2026-05-29 19:00:00', 2, 95, 'confirmed', 'pi_3TcRA6G1KHOI96vc0j7uqmQV', 'cmpqx79ga0001sczmts815xgb', 'cmpa3hvv50000scr01mjfohre', '2026-05-29 14:13:52.604');
INSERT INTO public.bookings (id, "checkIn", "checkOut", guests, "totalPrice", status, "stripePaymentId", "listingId", "guestId", "createdAt") VALUES ('cmpr1927i0001sc0aef0ikes1', '2026-05-31 19:00:00', '2026-06-01 19:00:00', 1, 95, 'confirmed', 'pi_3TcRdPG1KHOI96vc1fmDQwgZ', 'cmpqx79ga0001sczmts815xgb', 'cmpa3hvv50000scr01mjfohre', '2026-05-29 14:44:17.646');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.messages (id, content, "isRead", "senderId", "receiverId", "createdAt") VALUES ('cmplj963k0001sc2f08vdfpuq', 'Salom', true, 'cmpa3hvv50000scr01mjfohre', 'cmpa3hvv50000scr01mjfohre', '2026-05-25 18:21:38.72');
INSERT INTO public.messages (id, content, "isRead", "senderId", "receiverId", "createdAt") VALUES ('cmplkzxlc0003sc2fawnswmv2', 'Yaxshmz', true, 'cmpa3hvv50000scr01mjfohre', 'cmpa3hvv50000scr01mjfohre', '2026-05-25 19:10:27.024');
INSERT INTO public.messages (id, content, "isRead", "senderId", "receiverId", "createdAt") VALUES ('cmpr00cur0001scem2piug8vg', 'Salom 👋', true, 'cmpa3hvv50000scr01mjfohre', 'cmpqv5e5g0000scw97msx3n9e', '2026-05-29 14:09:31.923');
INSERT INTO public.messages (id, content, "isRead", "senderId", "receiverId", "createdAt") VALUES ('cmpr01ilx0005scemo29m89e7', 'Yaxhsmz nma yordam bersam boladi', true, 'cmpqv5e5g0000scw97msx3n9e', 'cmpa3hvv50000scr01mjfohre', '2026-05-29 14:10:26.037');


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reviews (id, rating, comment, "listingId", "authorId", "createdAt") VALUES ('cmplgtayx0001sc0vu3pgznze', 5, 'Test qilinvoti', '1', 'cmpa3hvv50000scr01mjfohre', '2026-05-25 17:13:19.305');


--
-- PostgreSQL database dump complete
--

\unrestrict 2CRgES47LdKcbmHLy8gir7TLiosYGYPgi1JgMlkjizsX78xm0UNTIcA9fsWTOlY

