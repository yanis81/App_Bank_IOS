-- Migration 004 : Correction de la contrainte email sur users
-- Problème : email TEXT UNIQUE NOT NULL causait un conflit quand plusieurs
-- utilisateurs étaient créés sans email (tous insérés avec 'unknown@placeholder').
-- Solution : supprimer le UNIQUE sur email, le rendre nullable.
-- Clerk gère déjà l'unicité des emails côté auth.

-- Supprimer la contrainte UNIQUE sur email
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Rendre email nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Nettoyer les placeholders existants (les remplacer par NULL)
UPDATE users SET email = NULL WHERE email = 'unknown@placeholder';
