-- News/Actualités CMS — run once in the Supabase SQL editor.
--
-- Also required, via the Supabase Dashboard (cannot be done in SQL):
--   Storage → New Bucket → name: news-images → Public: ON

CREATE TABLE news_articles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category           TEXT NOT NULL DEFAULT 'vie',   -- recherche | vie | plateforme | evenement
  published          BOOLEAN NOT NULL DEFAULT true,
  featured           BOOLEAN NOT NULL DEFAULT false, -- shows in the homepage "Dernière actualité" teaser
  image_url          TEXT,
  published_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  read_time_minutes  INT NOT NULL DEFAULT 3,

  title_fr           TEXT NOT NULL,
  excerpt_fr         TEXT NOT NULL,
  title_en           TEXT,
  excerpt_en         TEXT,
  title_ar           TEXT,
  excerpt_ar         TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_articles_published ON news_articles (published, published_at DESC);

-- Reuses the same auto-update-timestamp function created by
-- supabase_migration.sql / chat_sessions — CREATE OR REPLACE makes this
-- safe to run even if that function doesn't already exist in this project.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_news_articles_updated_at
BEFORE UPDATE ON news_articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed with the articles currently hardcoded on the site (French only —
-- add EN/AR translations from the admin panel whenever convenient).
INSERT INTO news_articles (category, featured, published_at, read_time_minutes, title_fr, excerpt_fr) VALUES
('recherche',  true,  '2026-04-28', 4, 'Nouveau partenariat avec le Centre Hospitalier Universitaire d''El Jadida pour la recherche clinique en gériatrie et médecine préventive', 'L''IPISB et le Centre Hospitalier Universitaire d''El Jadida unissent leurs forces pour développer des projets cliniques conjoints en gériatrie et médecine préventive.'),
('vie',        false, '2026-04-22', 3, 'Cérémonie solennelle de remise des diplômes de la promotion 2025', 'Plus de 180 étudiants ont reçu leur diplôme lors d''une cérémonie à l''amphithéâtre principal.'),
('plateforme', false, '2026-04-10', 2, 'Le module Recherche & Publications est désormais disponible pour tous', 'Un nouvel espace dédié à la publication, la lecture et la collaboration scientifique entre étudiants et enseignants.');
