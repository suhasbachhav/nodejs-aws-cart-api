-- Insert sample carts
INSERT INTO carts (id, user_id, created_at, updated_at, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW(), 'OPEN'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW(), 'ORDERED');

-- Insert sample cart items
INSERT INTO cart_items (cart_id, product_id, count) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 2),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 1),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 4);
