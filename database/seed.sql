INSERT INTO roles (name, description)
VALUES
  ('client', 'Usuário padrão do planejador RioCard'),
  ('admin', 'Administrador do sistema')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
