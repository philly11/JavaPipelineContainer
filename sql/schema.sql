-- schema.sql
-- Run this script against your SQL Server instance to create the database
-- and the Users table used by server.js for authentication.
--
-- Usage (sqlcmd):
--   sqlcmd -S localhost -U sa -P <password> -i sql\schema.sql

IF DB_ID('JavaPipelineDB') IS NULL
BEGIN
    CREATE DATABASE JavaPipelineDB;
END
GO

USE JavaPipelineDB;
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        Username      NVARCHAR(50)  NOT NULL UNIQUE,
        PasswordHash  NVARCHAR(255) NOT NULL,
        CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO
