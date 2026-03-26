-- ============================================================
-- ADD MISSING COLUMNS TO BOOKS TABLE
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS year        integer,
  ADD COLUMN IF NOT EXISTS publisher   text,
  ADD COLUMN IF NOT EXISTS genre       text;

-- ============================================================
-- 10 LIBROS DE EJEMPLO
-- IMPORTANTE: reemplaza 'fb6ac4b1-1d38-467b-8418-a4282aba6756' con tu UUID de auth.users
-- Lo puedes obtener con: SELECT id FROM auth.users LIMIT 1;
-- ============================================================

INSERT INTO books (title, author, description, price, seller_id, status, isbn, condition, category, year, publisher, genre, image_url)
VALUES

-- 1
('Cien años de soledad',
 'Gabriel García Márquez',
 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo mítico de Macondo. Una obra maestra del realismo mágico latinoamericano.',
 220, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9786070728792', 'good', 'ficcion', 2015, 'Diana', 'Realismo Mágico',
 'https://covers.openlibrary.org/b/isbn/9786070728792-L.jpg'),

-- 2
('El principito',
 'Antoine de Saint-Exupéry',
 'Un piloto varado en el Sahara conoce a un pequeño príncipe que viaja de planeta en planeta. Un clásico atemporal sobre la amistad, el amor y la esencia de la vida.',
 150, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9788498381498', 'like_new', 'ficcion', 2018, 'Salamandra', 'Fábula',
 'https://covers.openlibrary.org/b/isbn/9788498381498-L.jpg'),

-- 3
('Hábitos atómicos',
 'James Clear',
 'Un método sencillo y comprobado para desarrollar buenos hábitos y eliminar los malos. La guía definitiva para hacer pequeños cambios que producen resultados extraordinarios.',
 320, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9786075278384', 'new', 'desarrollo-personal', 2020, 'Paidós', 'Autoayuda',
 'https://covers.openlibrary.org/b/isbn/9786075278384-L.jpg'),

-- 4
('1984',
 'George Orwell',
 'En un futuro distópico, Winston Smith trabaja para el Partido reescribiendo la historia. Una novela profética sobre la vigilancia, la propaganda y la supresión de la libertad.',
 180, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9786070727771', 'good', 'ficcion', 2017, 'Debolsillo', 'Distopía',
 'https://covers.openlibrary.org/b/isbn/9786070727771-L.jpg'),

-- 5
('El alquimista',
 'Paulo Coelho',
 'Un joven pastor andaluz emprende un viaje hacia los tesoros del Egipto. Un relato fabuloso sobre la importancia de escuchar el corazón y de seguir nuestros sueños.',
 175, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9786070728730', 'like_new', 'ficcion', 2016, 'Planeta', 'Ficción filosófica',
 'https://covers.openlibrary.org/b/isbn/9786070728730-L.jpg'),

-- 6
('Sapiens: De animales a dioses',
 'Yuval Noah Harari',
 'Una breve historia de la humanidad que examina cómo Homo sapiens llegó a dominar la Tierra, desde la revolución cognitiva hasta la revolución científica.',
 370, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9786075275017', 'good', 'no-ficcion', 2019, 'Debate', 'Historia',
 'https://covers.openlibrary.org/b/isbn/9786075275017-L.jpg'),

-- 7
('El nombre del viento',
 'Patrick Rothfuss',
 'Kvothe, el legendario mago, narra su propia historia: desde su infancia en una familia de actores viajeros hasta convertirse en el estudiante más brillante de su generación.',
 280, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9788401337208', 'good', 'ficcion', 2014, 'Plaza & Janés', 'Fantasía épica',
 'https://covers.openlibrary.org/b/isbn/9788401337208-L.jpg'),

-- 8
('Piense y hágase rico',
 'Napoleon Hill',
 'El resultado de más de 20 años de investigación sobre los hábitos y filosofías de los hombres más ricos del mundo. Un clásico de la superación personal.',
 130, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9786077483113', 'acceptable', 'desarrollo-personal', 2012, 'Tomo', 'Autoayuda',
 NULL),

-- 9
('Don Quijote de la Mancha',
 'Miguel de Cervantes',
 'Las aventuras del ingenioso hidalgo don Quijote de la Mancha y su escudero Sancho Panza. Considerada la primera novela moderna y la obra cumbre de la literatura española.',
 195, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9788467047059', 'good', 'clasicos', 2014, 'Espasa', 'Novela picaresca',
 NULL),

-- 10
('Harry Potter y la piedra filosofal',
 'J.K. Rowling',
 'El joven Harry Potter descubre en su undécimo cumpleaños que es un mago y comienza sus estudios en Hogwarts, la escuela de magia y hechicería más famosa del mundo.',
 210, 'fb6ac4b1-1d38-467b-8418-a4282aba6756', 'available',
 '9788478884452', 'like_new', 'ficcion', 2015, 'Salamandra', 'Fantasía juvenil',
 'https://covers.openlibrary.org/b/isbn/9788478884452-L.jpg');

-- Verificar que se insertaron
SELECT title, author, price, genre, year FROM books ORDER BY created_at DESC LIMIT 10;
