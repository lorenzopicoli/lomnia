UPDATE knex_migrations SET name = regexp_replace(name, '\.js$', '.ts') WHERE name LIKE '%.js';

