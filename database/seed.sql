-- 1. ROOM_TYPES
INSERT INTO ROOM_TYPES (id, name) VALUES
('rt-standard', 'Standard'),
('rt-deluxe',   'Deluxe'),
('rt-family',   'Family Suite'),
('rt-connect',  'Connecting Room');
  
-- 2. VIEW_TYPES
INSERT INTO VIEW_TYPES (id, name) VALUES
('vt-sea',    'Sea View'),
('vt-garden', 'Garden View'),
('vt-city',   'City View');
 
 
-- 3. BED_TYPES
INSERT INTO BED_TYPES (id, name) VALUES
('bt-queen',  'Queen'),
('bt-king',   'King'),
('bt-twin',   'Twin'),
('bt-double', 'Double'),
('bt-bunk',   'Bunk');
 
 
-- 4. AMENITIES
-- ---------------------------------------------------------------------
INSERT INTO AMENITIES (id, name, icon_name) VALUES
('am-wifi',           'Free WiFi',            'wifi'),
('am-ac',              'Air Conditioning',     'sparkles'),
('am-flattv',          'Flat-screen TV',       'tv'),
('am-smarttv',         'Smart TV',             'tv'),
('am-4ktv',            '4K Smart TV',          'tv'),
('am-minibar',         'Mini Bar',             'coffee'),
('am-premiumminibar',  'Premium Minibar',      'coffee'),
('am-roomservice',     'Room Service',         'utensils'),
('am-24hservice',      '24h Room Service',     'clock'),
('am-panoramicsea',    'Panoramic Sea View',   'eye'),
('am-ensuite',         'En-suite Bathroom',    'bath'),
('am-multibath',       'Multiple Bathrooms',   'bath'),
('am-coffee',          'Coffee Maker',         'coffee'),
('am-espresso',        'Espresso Machine',     'coffee'),
('am-workdesk',        'Work Desk',            'book-open'),
('am-fullkitchen',     'Full Kitchen',         'utensils'),
('am-kitchenette',     'Kitchenette',          'utensils'),
('am-balcony',         'Balcony',              'waves'),
('am-privatebalcony',  'Private Balcony',      'waves'),
('am-eastbalcony',     'East-facing Balcony',  'waves'),
('am-terrace',         'Private Terrace',      'waves'),
('am-gardenterrace',   'Garden Terrace',       'leaf'),
('am-childarea',       'Children''s Area',     'heart'),
('am-childplay',       'Children''s Play Area','heart'),
('am-laundry',         'Laundry',              'sparkles'),
('am-patio',           'Private Patio',        'leaf'),
('am-connectdoor',     'Connecting Door',      'shield'),
('am-freestandtub',    'Freestanding Bathtub', 'bath'),
('am-rainfall',        'Rainfall Shower',      'waves'),
('am-turndown',        'Turndown Service',     'sparkles'),
('am-marble',          'Marble Bathroom',      'bath'),
('am-pillowmenu',      'Pillow Menu',          'heart'),
('am-jacuzzi',         'Jacuzzi',              'sparkles'),
('am-butler',          'Butler Service',       'shield'),
('am-champagne',       'Champagne on Arrival', 'sparkles'),
('am-soakingtub',      'Soaking Tub',          'bath');
 
 
-- 5. ROOMS
INSERT INTO ROOMS
(id, room_types_id, view_type_id, floor, name, rating, review_count, size,
 max_guests, bed_type_id, bed_count, description, price, is_active)
VALUES
('room-001', 'rt-standard', 'vt-sea',    1, 'Ocean Breeze Standard', 4.7, 124, 28, 2, 'bt-queen',  1,
 'Wake up to the gentle sound of waves in this beautifully appointed standard room. Floor-to-ceiling windows frame a captivating sea panorama, while warm tones create a serene sanctuary. Each morning begins with golden light spilling across the ocean surface, visible from your bed.',
 2225000, TRUE),
 
('room-002', 'rt-standard', 'vt-garden', 1, 'Garden Serenity Standard', 4.5, 89, 26, 2, 'bt-double', 1,
 'A tranquil retreat overlooking our lush tropical garden. The soft rustling of palms and fragrant blooms create a natural backdrop for your perfect getaway. Cool breezes drift through the jalousie windows every evening.',
 1975000, TRUE),
 
('room-003', 'rt-standard', 'vt-city',   1, 'Twin Comfort Standard', 4.3, 67, 26, 2, 'bt-twin', 2,
 'Perfect for colleagues or friends, this twin room offers two comfortable beds and city views. Clean, modern, and thoughtfully designed for the practical traveler who values space and quality.',
 1875000, TRUE),
 
('room-004', 'rt-family', 'vt-sea',    1, 'Coastal Family Suite', 4.9, 201, 58, 5, 'bt-king', 2,
 'The ultimate family retreat. A spacious suite with a master bedroom, separate children''s area with bunk beds, and a generous living space. Step onto your private balcony for breathtaking ocean views. Children love it; parents never want to leave.',
 4725000, TRUE),
 
('room-005', 'rt-family', 'vt-garden', 1, 'Garden Family Room', 4.7, 145, 52, 4, 'bt-queen', 2,
 'Nestled beside our tropical garden, this family suite offers generous space for up to four guests. Children will love watching exotic birds from the private patio each morning.',
 4225000, TRUE),
 
('room-006', 'rt-standard', 'vt-garden', 1, 'Palm Grove Standard', 4.4, 78, 28, 2, 'bt-queen', 1,
 'Cozy and comfortable, this garden-facing standard room offers a peaceful retreat with a private seating area among the palms. The perfect room for guests who value quiet above all else.',
 2050000, TRUE),
 
('room-007', 'rt-connect', 'vt-sea',    1, 'Seaside Connecting Suite', 4.6, 93, 48, 4, 'bt-king', 2,
 'Two connected rooms, one key. Perfect for multigenerational families, the Seaside Connecting gives adults and children their own space while staying close.',
 3975000, TRUE),
 
('room-008', 'rt-standard', 'vt-city',   1, 'City View Standard', 4.2, 55, 24, 2, 'bt-double', 1,
 'A practical and comfortable standard room with city views. Ideal for the solo traveler or business couple seeking good value in a prime location.',
 1800000, TRUE),
 
('room-009', 'rt-deluxe', 'vt-sea',    2, 'Horizon Deluxe', 4.8, 187, 36, 2, 'bt-king', 1,
 'Elevated living with panoramic sea views from the second floor. The Horizon Deluxe features a spa-style bathroom with freestanding tub, premium linens, and curated local artwork. A sanctuary for those who appreciate thoughtful luxury.',
 3225000, TRUE),
 
('room-010', 'rt-deluxe', 'vt-sea',    2, 'Terrace Deluxe', 4.8, 162, 40, 3, 'bt-king', 1,
 'Your private terrace awaits. Sip morning coffee as the sun rises over the ocean, then spend evenings watching the horizon glow in amber and violet. The terrace has a daybed and outdoor shower.',
 3475000, TRUE),
 
('room-011', 'rt-deluxe', 'vt-garden', 2, 'Garden Deluxe', 4.6, 103, 34, 2, 'bt-king', 1,
 'A romantic garden-view deluxe room offering elevated tranquility. The second-floor position catches the gentle sea breeze while overlooking our manicured tropical grounds.',
 2975000, TRUE),
 
('room-012', 'rt-deluxe', 'vt-city',   2, 'Twin Deluxe', 4.5, 88, 32, 2, 'bt-twin', 2,
 'Upgraded twin beds meet deluxe finishes. Perfect for friends traveling together who want to share the experience without compromising on individual comfort.',
 2800000, TRUE),
 
('room-013', 'rt-deluxe', 'vt-sea',    2, 'Sea Breeze Deluxe', 4.9, 211, 38, 2, 'bt-king', 1,
 'The most sought-after room on the second floor. Every corner of this deluxe room frames the sea, from the bed to the marble bathroom vanity. Guests consistently rate it the most beautiful in the hotel.',
 3375000, TRUE),
 
('room-014', 'rt-connect', 'vt-garden', 2, 'Deluxe Garden Connecting', 4.6, 74, 50, 4, 'bt-king', 2,
 'Two deluxe rooms connected by a private hallway, each with garden views. Ideal for families who want the intimacy of a suite with the flexibility of separate rooms.',
 4225000, TRUE),
 
('room-015', 'rt-deluxe', 'vt-sea',    2, 'Panorama Deluxe', 4.7, 139, 40, 2, 'bt-king', 1,
 'Floor-to-ceiling panoramic windows wrap around this corner deluxe room, giving an unobstructed 180-degree view of the open sea. The Jacuzzi tub faces the view, a decision you will appreciate.',
 3625000, TRUE),
 
('room-016', 'rt-family', 'vt-sea',    3, 'Ocean Haven Suite', 5.0, 87, 72, 6, 'bt-king', 3,
 'Our signature suite occupies the entire northeast corner of the third floor. A king master bedroom, two twin rooms, a panoramic sea terrace, and a full kitchen make this the ultimate family sanctuary above the ocean.',
 6225000, TRUE),
 
('room-017', 'rt-deluxe', 'vt-sea',    3, 'Penthouse Deluxe', 4.9, 156, 48, 2, 'bt-king', 1,
 'The highest deluxe in the hotel. On the third floor, the Penthouse Deluxe offers an elevated sea view unlike any other, with ceiling-height windows and a private lounging terrace.',
 4725000, TRUE),
 
('room-018', 'rt-family', 'vt-garden', 3, 'Sky Garden Suite', 4.8, 112, 65, 5, 'bt-king', 2,
 'Treetop living on the third floor. The Sky Garden Suite overlooks an expanse of tropical canopy with a rooftop-style terrace where children can play safely while parents unwind below the palms.',
 5475000, TRUE),
 
('room-019', 'rt-connect', 'vt-sea',    3, 'Rooftop Connecting', 4.8, 98, 68, 6, 'bt-king', 3,
 'Three top-floor rooms united. The Rooftop Connecting configuration offers unrivaled flexibility, perfect for large family groups who want to stay together yet enjoy private space.',
 5725000, TRUE),
 
('room-020', 'rt-deluxe', 'vt-sea',    3, 'Sunset Deluxe', 4.8, 143, 42, 2, 'bt-king', 1,
 'Named for the spectacular sunsets visible from its west-facing balcony. Watch the sky ignite in color while soaking in the private bathtub, the most romantic room in the hotel.',
 4375000, TRUE),
 
('room-021', 'rt-standard', 'vt-garden', 3, 'Treetop Standard', 4.4, 61, 28, 2, 'bt-queen', 1,
 'Perched on the third floor, this standard room surprises with sweeping garden-to-sea glimpses. Unpretentious and honest, it rewards guests who know that the best views don''t always require the biggest budget.',
 2375000, TRUE),
 
('room-022', 'rt-family', 'vt-sea',    3, 'Sunrise Suite', 4.9, 177, 68, 5, 'bt-king', 2,
 'Every morning begins with the ocean waking you gently. The Sunrise Suite faces east, capturing the first light across the sea. A spacious living area, generous king bedroom, and separate twin room make family mornings feel leisurely.',
 5875000, TRUE);
 
 
-- 6. ROOM_IMAGES
INSERT INTO ROOM_IMAGES (room_id, image_url, is_primary) VALUES
('room-001', 'https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format', TRUE),
('room-001', 'https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=1200&h=800&fit=crop&auto=format', FALSE),
('room-001', 'https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=1200&h=800&fit=crop&auto=format', FALSE),
 
('room-002', 'https://images.unsplash.com/photo-1695706807850-8c66b24b3413?w=1200&h=800&fit=crop&auto=format', TRUE),
('room-002', 'https://images.unsplash.com/photo-1637730827702-de34e9ae4ede?w=1200&h=800&fit=crop&auto=format', FALSE),
 
('room-003', 'https://images.unsplash.com/photo-1637730827702-de34e9ae4ede?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-004', 'https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=1200&h=800&fit=crop&auto=format', TRUE),
('room-004', 'https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format', FALSE),
('room-004', 'https://images.unsplash.com/photo-1693098243367-93320637839e?w=1200&h=800&fit=crop&auto=format', FALSE),
 
('room-005', 'https://images.unsplash.com/photo-1689717887631-088197cdc2ca?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-006', 'https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-007', 'https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-008', 'https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-009', 'https://images.unsplash.com/photo-1779942578833-5f00dc79d6d1?w=1200&h=800&fit=crop&auto=format', TRUE),
('room-009', 'https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=1200&h=800&fit=crop&auto=format', FALSE),
 
('room-010', 'https://images.unsplash.com/photo-1693098243367-93320637839e?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-011', 'https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-012', 'https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-013', 'https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-014', 'https://images.unsplash.com/photo-1609602126247-4ab7188b4aa1?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-015', 'https://images.unsplash.com/photo-1664189767954-e4e605ae46da?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-016', 'https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format', TRUE),
('room-016', 'https://images.unsplash.com/photo-1779942578833-5f00dc79d6d1?w=1200&h=800&fit=crop&auto=format', FALSE),
('room-016', 'https://images.unsplash.com/photo-1693098243367-93320637839e?w=1200&h=800&fit=crop&auto=format', FALSE),
 
('room-017', 'https://images.unsplash.com/photo-1702830499141-a0634d87d6af?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-018', 'https://images.unsplash.com/photo-1689717887631-088197cdc2ca?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-019', 'https://images.unsplash.com/photo-1775566081059-6e35805e4edd?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-020', 'https://images.unsplash.com/photo-1696854649609-1fd6e5abf87f?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-021', 'https://images.unsplash.com/photo-1695706807850-8c66b24b3413?w=1200&h=800&fit=crop&auto=format', TRUE),
 
('room-022', 'https://images.unsplash.com/photo-1776761603930-e4509e386fbf?w=1200&h=800&fit=crop&auto=format', TRUE),
('room-022', 'https://images.unsplash.com/photo-1776876648949-63ccabf63b10?w=1200&h=800&fit=crop&auto=format', FALSE);
 
 
-- 7. ROOM_AMENITIES
INSERT INTO ROOM_AMENITIES (room_id, amenity_id) VALUES
('room-001','am-wifi'),('room-001','am-ac'),('room-001','am-flattv'),('room-001','am-minibar'),('room-001','am-roomservice'),('room-001','am-ensuite'),
 
('room-002','am-wifi'),('room-002','am-ac'),('room-002','am-flattv'),('room-002','am-coffee'),('room-002','am-ensuite'),
 
('room-003','am-wifi'),('room-003','am-ac'),('room-003','am-flattv'),('room-003','am-workdesk'),('room-003','am-ensuite'),
 
('room-004','am-wifi'),('room-004','am-ac'),('room-004','am-flattv'),('room-004','am-fullkitchen'),('room-004','am-balcony'),('room-004','am-multibath'),('room-004','am-childarea'),('room-004','am-laundry'),
 
('room-005','am-wifi'),('room-005','am-ac'),('room-005','am-flattv'),('room-005','am-kitchenette'),('room-005','am-patio'),('room-005','am-multibath'),
 
('room-006','am-wifi'),('room-006','am-ac'),('room-006','am-flattv'),('room-006','am-coffee'),('room-006','am-ensuite'),
 
('room-007','am-wifi'),('room-007','am-ac'),('room-007','am-flattv'),('room-007','am-minibar'),('room-007','am-connectdoor'),('room-007','am-multibath'),
 
('room-008','am-wifi'),('room-008','am-ac'),('room-008','am-flattv'),('room-008','am-workdesk'),('room-008','am-ensuite'),
 
('room-009','am-wifi'),('room-009','am-ac'),('room-009','am-4ktv'),('room-009','am-freestandtub'),('room-009','am-rainfall'),('room-009','am-minibar'),('room-009','am-balcony'),('room-009','am-turndown'),
 
('room-010','am-wifi'),('room-010','am-ac'),('room-010','am-4ktv'),('room-010','am-terrace'),('room-010','am-minibar'),('room-010','am-rainfall'),('room-010','am-espresso'),
 
('room-011','am-wifi'),('room-011','am-ac'),('room-011','am-smarttv'),('room-011','am-minibar'),('room-011','am-rainfall'),('room-011','am-workdesk'),
 
('room-012','am-wifi'),('room-012','am-ac'),('room-012','am-smarttv'),('room-012','am-minibar'),('room-012','am-rainfall'),('room-012','am-workdesk'),
 
('room-013','am-wifi'),('room-013','am-ac'),('room-013','am-4ktv'),('room-013','am-balcony'),('room-013','am-marble'),('room-013','am-premiumminibar'),('room-013','am-pillowmenu'),
 
('room-014','am-wifi'),('room-014','am-ac'),('room-014','am-smarttv'),('room-014','am-connectdoor'),('room-014','am-multibath'),('room-014','am-minibar'),
 
('room-015','am-wifi'),('room-015','am-ac'),('room-015','am-4ktv'),('room-015','am-panoramicsea'),('room-015','am-jacuzzi'),('room-015','am-minibar'),('room-015','am-espresso'),
 
('room-016','am-wifi'),('room-016','am-ac'),('room-016','am-smarttv'),('room-016','am-fullkitchen'),('room-016','am-terrace'),('room-016','am-multibath'),('room-016','am-jacuzzi'),('room-016','am-childplay'),('room-016','am-butler'),('room-016','am-24hservice'),
 
('room-017','am-wifi'),('room-017','am-ac'),('room-017','am-4ktv'),('room-017','am-terrace'),('room-017','am-jacuzzi'),('room-017','am-premiumminibar'),('room-017','am-butler'),
 
('room-018','am-wifi'),('room-018','am-ac'),('room-018','am-smarttv'),('room-018','am-fullkitchen'),('room-018','am-gardenterrace'),('room-018','am-multibath'),('room-018','am-childarea'),
 
('room-019','am-wifi'),('room-019','am-ac'),('room-019','am-smarttv'),('room-019','am-connectdoor'),('room-019','am-multibath'),('room-019','am-roomservice'),
 
('room-020','am-wifi'),('room-020','am-ac'),('room-020','am-4ktv'),('room-020','am-privatebalcony'),('room-020','am-champagne'),('room-020','am-soakingtub'),
 
('room-021','am-wifi'),('room-021','am-ac'),('room-021','am-smarttv'),('room-021','am-ensuite'),
 
('room-022','am-wifi'),('room-022','am-ac'),('room-022','am-smarttv'),('room-022','am-kitchenette'),('room-022','am-eastbalcony'),('room-022','am-multibath'),('room-022','am-roomservice');
 
 
-- 8. USERS
-- password_hash là PLACEHOLDER (chuỗi bcrypt giả) -- thay bằng hash thật
-- ---------------------------------------------------------------------
INSERT INTO USERS (id, name, email, password_hash, phone, avatar_url, create_at) VALUES
('user-001', 'Nguyen Van An', 'vanan@gmail.com',
 '$2y$10$PLACEHOLDER_HASH_REPLACE_ME_00000000000000000000',
 '0901234567', NULL, '2023-01-01 00:00:00');
 
-- 9. BOOKINGS
INSERT INTO BOOKINGS
(id, booking_code, user_id, room_id, check_in, check_out, guest_count,
 guest_name, guest_email, guest_phone, special_requests, total_price, status, create_at)
VALUES
('booking-001', 'OH-2025-0234', 'user-001', 'room-004', '2025-06-20', '2025-06-25', 4,
 'Nguyen Van An', 'vanan@gmail.com', '0901234567', NULL, 945, 'Confirmed', '2025-05-02 00:00:00'),
 
('booking-002', 'OH-2024-0891', 'user-001', 'room-009', '2025-03-15', '2025-03-18', 2,
 'Nguyen Van An', 'vanan@gmail.com', '0901234567', NULL, 387, 'Completed', '2025-03-10 00:00:00'),
 
('booking-003', 'OH-2024-0612', 'user-001', 'room-001', '2024-12-24', '2024-12-26', 2,
 'Nguyen Van An', 'vanan@gmail.com', '0901234567', NULL, 178, 'Completed', '2024-12-18 00:00:00'),
 
('booking-004', 'OH-2023-1104', 'user-001', 'room-002', '2023-11-01', '2023-11-03', 1,
 'Nguyen Van An', 'vanan@gmail.com', '0901234567', NULL, 158, 'Cancelled', '2023-10-25 00:00:00');
 
 
-- 10. PAYMENTS
INSERT INTO PAYMENTS
(id, booking_id, payment_method, transaction_id, momo_order_id, amount, status, paid_at)
VALUES
('payment-001', 'booking-001', 'MoMo',        'TXN-OH-2025-0234', 'MOMO-ORDER-0234', 945, 'Completed', '2025-05-02 00:05:00'),
('payment-002', 'booking-002', 'Credit Card', 'TXN-OH-2024-0891', NULL,               387, 'Completed', '2025-03-10 00:05:00'),
('payment-003', 'booking-003', 'Credit Card', 'TXN-OH-2024-0612', NULL,               178, 'Completed', '2024-12-18 00:05:00'),
('payment-004', 'booking-004', 'MoMo',        'TXN-OH-2023-1104', 'MOMO-ORDER-1104', 158, 'Refunded',  '2023-10-25 00:05:00');
 
 
-- 11. HISTORY_BOOKING
INSERT INTO HISTORY_BOOKING (id, booking_id, action, note, created_at) VALUES
('history-001', 'booking-001', 'CREATED',   'Booking created by guest', '2025-05-02 00:00:00'),
('history-002', 'booking-001', 'PAID',      'Payment completed via MoMo', '2025-05-02 00:05:00'),
('history-003', 'booking-004', 'CREATED',   'Booking created by guest', '2023-10-25 00:00:00'),
('history-004', 'booking-004', 'CANCELLED', 'Guest requested cancellation, refund issued', '2023-10-27 00:00:00');