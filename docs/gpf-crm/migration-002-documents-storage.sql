-- GPF CRM — Migration 002 : stockage de documents par dossier (Supabase Storage)
-- À exécuter dans l'éditeur SQL de Supabase, après la migration 001.

-- Bucket de stockage privé (accès uniquement via le service role, comme le reste de GPF).
insert into storage.buckets (id, name, public)
values ('gpf-documents', 'gpf-documents', false)
on conflict (id) do nothing;

-- La table gpf_documents existait déjà (type figé + simple lien). On l'ouvre à un
-- vrai upload de fichier : type libre, nom de fichier, chemin dans le bucket.
alter table gpf_documents drop constraint if exists gpf_documents_type_check;
alter table gpf_documents add column if not exists nom_fichier text;
alter table gpf_documents add column if not exists storage_path text;
alter table gpf_documents add column if not exists taille_octets bigint;
