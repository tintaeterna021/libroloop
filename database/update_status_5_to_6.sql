-- ============================================================
-- LIBROLOOP — Update Status Code 5 to 6
-- Run this in the Supabase SQL editor
-- ============================================================

-- Update all books with status 5 (published) to status 6
UPDATE books
SET status_code = 6
WHERE status_code = 5;

-- Verify the update
-- SELECT id, title, status_code FROM books WHERE status_code = 6;
