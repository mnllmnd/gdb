-- Supprimer la contrainte NOT NULL si elle existe déjà (pour éviter les erreurs)
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;

-- Supprimer la contrainte de clé étrangère si elle existe
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Créer la table des catégories si elle n'existe pas
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supprimer toutes les catégories existantes pour éviter les doublons
DELETE FROM categories;

-- Réinitialiser la séquence pour l'id
ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- Insérer les catégories avec des IDs spécifiques
INSERT INTO categories (id, name) VALUES 
(1, 'Vêtements'),
(2, 'Accessoires'),
(3, 'Art & Décoration'),
(4, 'Bijoux'),
(5, 'Maison'),
(6, 'Cosmétiques'),
(7, 'Alimentation'),
(8, 'Autres');

-- S'assurer que la séquence est mise à jour correctement
SELECT setval('categories_id_seq', 8);

-- Ajouter la colonne category_id si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id INTEGER;
    END IF;
END $$;

-- Mettre à jour tous les produits sans catégorie pour utiliser la catégorie "Autres"
UPDATE products SET category_id = 8 WHERE category_id IS NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES categories(id);