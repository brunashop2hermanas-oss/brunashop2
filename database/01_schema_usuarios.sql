-- ==============================================================================
-- BASE DE DATOS: BrunaShop2 (Supabase / PostgreSQL)
-- ==============================================================================
-- Archivo: 01_schema_usuarios.sql
-- Propósito: Almacenar los datos de los clientes y administradores (dueña).
-- ==============================================================================

-- Habilitar extensión para generar identificadores únicos (UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creación de la tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol VARCHAR(50) NOT NULL DEFAULT 'clienta', -- Puede ser 'clienta' o 'admin'
    
    -- Datos personales
    nombre_completo VARCHAR(255) NOT NULL,
    numero_celular VARCHAR(20) UNIQUE NOT NULL,
    ci_documento VARCHAR(50) UNIQUE, -- Cédula de Identidad, útil para envíos
    correo_electronico VARCHAR(255) UNIQUE,
    
    -- Datos de Envío (Los pediremos al hacer el pedido, pero se pueden guardar por defecto)
    direccion_envio TEXT,
    ciudad_o_lugar VARCHAR(100),
    
    -- Sistema de Clientas Frecuentes
    compras_completadas INTEGER DEFAULT 0,
    es_clienta_frecuente BOOLEAN DEFAULT false,
    
    -- Metadatos de seguridad y registro
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP WITH TIME ZONE
);

-- ==============================================================================
-- NOTAS DE DISEÑO:
-- 1. Usamos UUID para evitar que los IDs sean predecibles (más seguridad).
-- 2. "es_clienta_frecuente" se puede actualizar automáticamente cuando 
--    "compras_completadas" llegue a un número, por ejemplo, 3 o 5 compras.
-- 3. "ci_documento" (Carnet de Identidad) es clave para los envíos por flota/bus.
-- ==============================================================================
