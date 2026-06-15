-- ==============================================================================
-- BASE DE DATOS: BrunaShop2
-- ==============================================================================
-- Archivo: 02_schema_productos.sql
-- Propósito: Estructura profesional de categorías, catálogo de ropa y variantes.
-- ==============================================================================

-- 1. Tabla de Categorías (Organización principal)
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    esta_activa_en_live BOOLEAN DEFAULT false, -- Muestra la categoría entera en TikTok Live
    imagen_destacada_url TEXT,
    orden INTEGER DEFAULT 0, -- Para ordenar visualmente en la tienda
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Productos (Modelo de Ropa)
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    
    nombre VARCHAR(255) NOT NULL,
    descripcion_detallada TEXT,
    precio_base DECIMAL(10, 2) NOT NULL,
    precio_oferta DECIMAL(10, 2), -- Precio si está en promoción
    
    -- Control para TikTok Live (A nivel de producto individual)
    destacado_en_live BOOLEAN DEFAULT false,
    
    -- Metadatos SEO y diseño
    etiqueta_especial VARCHAR(50), -- Ej: "Nuevo", "Top Ventas"
    modelo_3d_url TEXT, -- Opcional, si queremos mostrar un modelo 3D de la prenda
    
    esta_publicado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE
);

-- 3. Tabla de Variantes (Tallas y Colores por Producto, Control de Stock Exacto)
CREATE TABLE producto_variantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    
    talla VARCHAR(50) NOT NULL, -- S, M, L, XL, Estandar
    color VARCHAR(50) NOT NULL, -- Rojo, Negro, Estampado
    
    -- Inventario
    stock_actual INTEGER NOT NULL DEFAULT 0,
    nivel_stock_alerta INTEGER NOT NULL DEFAULT 3, -- Alerta en dashboard si baja de esto
    
    -- Imagen específica del color
    imagen_url TEXT,
    
    UNIQUE(producto_id, talla, color) -- Evita duplicados de la misma talla/color
);

-- ==============================================================================
-- NOTAS DE DISEÑO PROFESIONAL:
-- 1. Separamos "Productos" de "Variantes" (producto_variantes). Así un solo 
--    producto (ej. "Vestido Gala") puede tener talla S color Rojo, talla M color Azul,
--    y cada uno tiene su propio control de stock.
-- 2. Añadimos `destacado_en_live` directamente al producto por si la dueña 
--    quiere resaltar un producto específico, además de la categoría entera.
-- ==============================================================================
