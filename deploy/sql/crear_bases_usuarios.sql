
-- =====================================================
-- MEDIRED IPS - TALLER 3, MODULO 3
-- Configuracion de bases de datos y usuarios MySQL
-- =====================================================
-- Servidor de datos: svrBog1 - 172.16.2.42
-- Servidor autorizado: svrBog2 - 172.16.2.43
--
-- PLANTILLA DOCUMENTAL: NO EJECUTAR SIN ADAPTAR.
-- Las bases de datos y usuarios ya fueron creados.
-- Reemplazar las contrasenas de ejemplo antes de
-- utilizar estos comandos en una instalacion nueva.
-- Nunca publicar las contrasenas reales.
-- =====================================================

-- 1. CREACION DE BASES DE DATOS

CREATE DATABASE IF NOT EXISTS usuarios_db;
CREATE DATABASE IF NOT EXISTS pacientes_db;
CREATE DATABASE IF NOT EXISTS medicos_db;
CREATE DATABASE IF NOT EXISTS citas_db;
CREATE DATABASE IF NOT EXISTS historias_db;


-- 2. CREACION DE USUARIOS RESTRINGIDOS A SVRBOG2
-- Los valores entre < > son marcadores de posicion.
-- No contienen contrasenas reales.

CREATE USER 'usuarios_user'@'172.16.2.43'
IDENTIFIED BY '<CONTRASENA_SEGURA_USUARIOS>';

CREATE USER 'pacientes_user'@'172.16.2.43'
IDENTIFIED BY '<CONTRASENA_SEGURA_PACIENTES>';

CREATE USER 'medicos_user'@'172.16.2.43'
IDENTIFIED BY '<CONTRASENA_SEGURA_MEDICOS>';

CREATE USER 'citas_user'@'172.16.2.43'
IDENTIFIED BY '<CONTRASENA_SEGURA_CITAS>';

CREATE USER 'historias_user'@'172.16.2.43'
IDENTIFIED BY '<CONTRASENA_SEGURA_HISTORIAS>';


-- 3. ASIGNACION DE PERMISOS POR BASE DE DATOS

GRANT ALL PRIVILEGES ON usuarios_db.*
TO 'usuarios_user'@'172.16.2.43';

GRANT ALL PRIVILEGES ON pacientes_db.*
TO 'pacientes_user'@'172.16.2.43';

GRANT ALL PRIVILEGES ON medicos_db.*
TO 'medicos_user'@'172.16.2.43';

GRANT ALL PRIVILEGES ON citas_db.*
TO 'citas_user'@'172.16.2.43';

GRANT ALL PRIVILEGES ON historias_db.*
TO 'historias_user'@'172.16.2.43';


-- 4. VERIFICACION DE BASES DE DATOS

SHOW DATABASES;

-- Verificar los usuarios configurados:
SELECT user, host
FROM mysql.user
WHERE user IN (
    'usuarios_user',
    'pacientes_user',
    'medicos_user',
    'citas_user',
    'historias_user'
);
