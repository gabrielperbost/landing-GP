-- GPF CRM — Migration 013 : fiche société (SARL, SAS…) et représentant légal
-- Appliquée par le serveur via gpf_exec_sql.

-- Contact de type « entreprise » : identité de la société et compléments sur son représentant légal.
-- Le représentant reste porté par les champs du contact (civilité, prénom, nom, date de naissance,
-- e-mail, téléphone) ; ce bloc ajoute forme juridique, SIREN, NAF, capital, qualité du représentant, etc.
alter table gpf_clients add column if not exists societe jsonb not null default '{}'::jsonb;
