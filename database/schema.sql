-- Estructura de Base de Datos Libroloop

-- estatus cuenta
-- 1 activo
-- 2 suspendida

-- estatus libro
-- 1 en revisión
-- 2 negado
-- 4 aceptado
-- 6 publicado
-- 7 apartado
-- 8 pago adelanto
-- 9 liquidado a libroloop
-- 10 liquidado a vendedor
-- 11 dado de baja
-- 12 devuelto
-- 13 descuento aplicado

-- estatus orden
-- 1 confirmacion de pago
-- 2 preparacion
-- 3 en ruta
-- 4 entregado

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    phone TEXT,
    status_code INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_payout_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT,
    clabe TEXT,
    account_holder_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    street TEXT,
    external_number TEXT,
    internal_number TEXT,
    postal_code TEXT,
    neighborhood TEXT,
    references_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    proof_url TEXT,
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    total DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    total_with_shipping DECIMAL(10, 2),
    status_code INTEGER DEFAULT 1,
    payment_confirmed_at TIMESTAMPTZ,
    preparation_at TIMESTAMPTZ,
    in_transit_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    author TEXT,
    year INTEGER,
    publisher TEXT,
    isbn TEXT,
    genre TEXT,
    language TEXT,
    page_count INTEGER,
    description TEXT,
    original_front_image_url TEXT,
    original_back_image_url TEXT,
    publish_front_image_url TEXT,
    publish_back_image_url TEXT,
    original_price DECIMAL(10, 2),
    sale_price DECIMAL(10, 2),
    profit_amount DECIMAL(10, 2),
    seller_payout_amount DECIMAL(10, 2),
    status_code INTEGER DEFAULT 1,
    rejection_comment TEXT,
    internal_comment TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    payout_id UUID REFERENCES seller_payouts(id) ON DELETE SET NULL,
    review_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    reserved_at TIMESTAMPTZ,
    paid_to_libroloop_at TIMESTAMPTZ,
    paid_to_seller_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    discount_applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    link_amazon TEXT,
    link_sotano TEXT,
    link_buscalibre TEXT,
    link_gandhi TEXT,
    storage_option TEXT,
    extra_discount_percent INTEGER DEFAULT 0,
    link_pendulo TEXT
);
