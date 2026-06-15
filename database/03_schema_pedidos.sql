-- ==============================================================================
-- BASE DE DATOS: BrunaShop2
-- ==============================================================================
-- Archivo: 03_schema_pedidos.sql
-- Propósito: Gestión de Pedidos, Datos de Envío y Verificación.
-- ==============================================================================

-- 1. Tabla Principal de Pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Clienta que hace el pedido
    
    -- Estados del Pedido
    estado_pago VARCHAR(50) DEFAULT 'Pendiente de Verificación', -- Pendiente, Verificado, Rechazado
    estado_envio VARCHAR(50) DEFAULT 'Por Enviar', -- Por Enviar, Enviado, Entregado, Cancelado
    
    -- Datos Exactos de Envío (Ingresados en el Checkout)
    envio_nombre_destinatario VARCHAR(255) NOT NULL,
    envio_ci VARCHAR(50) NOT NULL,
    envio_celular VARCHAR(20) NOT NULL,
    envio_ciudad_destino VARCHAR(100) NOT NULL,
    envio_direccion_exacta TEXT,
    
    -- Empresa de Transporte (Llenado manualmente por la dueña)
    empresa_transporte_bus VARCHAR(150),
    numero_guia_envio VARCHAR(100), -- Si la flota da un número de rastreo/guía
    
    -- Comprobante de Pago (Antiestafas)
    comprobante_url TEXT, -- Link a la imagen que sube la clienta
    
    -- Totales y Fechas
    total_pagar DECIMAL(10, 2) NOT NULL,
    puntos_generados INTEGER DEFAULT 0, -- Puntos que ganará la clienta con esta compra
    puntos_utilizados INTEGER DEFAULT 0, -- Puntos que usó como descuento
    descuento_aplicado DECIMAL(10, 2) DEFAULT 0.00,
    
    fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_verificacion_pago TIMESTAMP WITH TIME ZONE,
    fecha_envio TIMESTAMP WITH TIME ZONE
);

-- 2. Detalles del Pedido (Qué productos exactamente compró)
CREATE TABLE detalles_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_variante_id UUID REFERENCES producto_variantes(id) ON DELETE SET NULL,
    
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL, -- Precio al momento de la compra
    subtotal DECIMAL(10, 2) NOT NULL
);

-- ==============================================================================
-- NOTAS DE DISEÑO PROFESIONAL:
-- 1. Al guardar "envio_nombre_destinatario" y "envio_ci", nos aseguramos de que
--    la dueña tenga la info exacta para mandar por flota/bus, y que coincida 
--    con los datos del comprobante que subirá.
-- 2. "comprobante_url" es vital para la Verificación Manual Antiestafas.
-- 3. Los "puntos_generados" se pueden sumar a la tabla 'usuarios' cuando el 
--    estado_pago cambie a 'Verificado'.
-- ==============================================================================
