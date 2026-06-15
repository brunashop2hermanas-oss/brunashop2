-- ==============================================================================
-- BASE DE DATOS: BrunaShop2
-- ==============================================================================
-- Archivo: 04_schema_pagos_y_puntos.sql
-- Propósito: Configuración de la cuenta bancaria (QR) y registro de puntos.
-- ==============================================================================

-- 1. Tabla de Configuración de Pagos (Para actualizar el QR fácilmente)
CREATE TABLE configuracion_pago (
    id SERIAL PRIMARY KEY,
    banco VARCHAR(100) NOT NULL,
    numero_cuenta VARCHAR(100) NOT NULL,
    titular_cuenta VARCHAR(255) NOT NULL,
    imagen_qr_url TEXT NOT NULL, -- Link a la imagen del QR actual
    es_activo BOOLEAN DEFAULT true, -- Solo debería haber uno activo a la vez
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Historial de Puntos (Para la Fidelización de Clientas)
CREATE TABLE historial_puntos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL, -- Si aplica a una compra
    
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ganados', 'usados', 'ajuste')),
    cantidad INTEGER NOT NULL, -- Puede ser positivo o negativo
    motivo VARCHAR(255), -- Ej: "Compra completada", "Descuento por fidelidad"
    
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- NOTAS DE DISEÑO PROFESIONAL:
-- 1. La "configuracion_pago" permite que la dueña cambie el QR y el número de 
--    cuenta en cualquier momento desde su panel. El sistema siempre mostrará 
--    el que tenga "es_activo = true".
-- 2. "historial_puntos" es un libro mayor contable de los puntos de cada clienta.
--    Sumando los "ganados" y restando los "usados", sabremos su saldo exacto.
-- ==============================================================================
