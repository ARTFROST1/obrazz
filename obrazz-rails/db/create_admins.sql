-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  password_digest varchar NOT NULL,
  name varchar,
  active boolean DEFAULT true NOT NULL,
  last_login_at timestamp,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS index_admins_on_email ON admins(email);

-- Insert default admin (password: changeme123)
INSERT INTO admins (id, email, password_digest, name, active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@obrazz.app',
  '$2a$12$XxT9K.9J8qZ5Y8Q3H4Y4Ye7wqV1K2Y5K8Q3H4Y4Ye7wqV1K2Y5K8Q',
  'Super Admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE email = 'admin@obrazz.app'
);
