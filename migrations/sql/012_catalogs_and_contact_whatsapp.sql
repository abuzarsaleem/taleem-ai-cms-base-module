-- Catalogs: departments, designations, identifier types; contact whatsapp

CREATE TABLE IF NOT EXISTS "taleem-ai-base".departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "taleem-ai-base".designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "taleem-ai-base".identifier_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "taleem-ai-base".tenant_contacts
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30);

-- Seed departments (higher-education oriented)
INSERT INTO "taleem-ai-base".departments (code, name, description) VALUES
  ('ACADEMICS', 'Academics', 'Academic affairs and curriculum'),
  ('ADMISSIONS', 'Admissions', 'Student admissions and enrollment'),
  ('REGISTRAR', 'Registrar Office', 'Student records and academic registry'),
  ('EXAMINATIONS', 'Examinations', 'Exams, results, and assessment'),
  ('FINANCE', 'Finance', 'Accounts, billing, and financial operations'),
  ('IT', 'Information Technology', 'IT systems and digital services'),
  ('HR', 'Human Resources', 'Staffing and employee relations'),
  ('LIBRARY', 'Library', 'Library and learning resources'),
  ('STUDENT_AFFAIRS', 'Student Affairs', 'Student support and activities'),
  ('QUALITY_ASSURANCE', 'Quality Assurance', 'QA, accreditation, and compliance'),
  ('RESEARCH', 'Research & Development', 'Research administration'),
  ('ADMINISTRATION', 'Administration', 'General administration')
ON CONFLICT (code) DO NOTHING;

-- Seed designations
INSERT INTO "taleem-ai-base".designations (code, name, description) VALUES
  ('VICE_CHANCELLOR', 'Vice Chancellor', 'Chief academic and administrative officer'),
  ('PRO_VICE_CHANCELLOR', 'Pro Vice Chancellor', 'Deputy to the Vice Chancellor'),
  ('REGISTRAR', 'Registrar', 'Head of academic registry'),
  ('DEAN', 'Dean', 'Head of a faculty'),
  ('DIRECTOR', 'Director', 'Director of a department or center'),
  ('HEAD_OF_DEPARTMENT', 'Head of Department', 'Academic department head'),
  ('PROFESSOR', 'Professor', 'Senior academic faculty'),
  ('ASSOCIATE_PROFESSOR', 'Associate Professor', 'Mid-senior academic faculty'),
  ('ASSISTANT_PROFESSOR', 'Assistant Professor', 'Junior academic faculty'),
  ('LECTURER', 'Lecturer', 'Teaching faculty'),
  ('CONTROLLER_EXAMINATIONS', 'Controller of Examinations', 'Head of examinations'),
  ('CFO', 'Chief Financial Officer', 'Head of finance'),
  ('CIO', 'Chief Information Officer', 'Head of IT'),
  ('HR_MANAGER', 'HR Manager', 'Human resources manager'),
  ('ADMIN_OFFICER', 'Administrative Officer', 'General administrative officer'),
  ('COORDINATOR', 'Coordinator', 'Program or department coordinator')
ON CONFLICT (code) DO NOTHING;

-- Seed identifier types
INSERT INTO "taleem-ai-base".identifier_types (code, name, description) VALUES
  ('REGISTRATION', 'Registration Number', 'Official institutional registration number'),
  ('TAX', 'Tax / NTN', 'Tax identification or national tax number'),
  ('ACCREDITATION', 'Accreditation ID', 'Accreditation or quality body identifier'),
  ('LICENSE', 'Operating License', 'Operating or education license number'),
  ('HEC', 'HEC Institution Code', 'Higher Education Commission institution code'),
  ('CHARTER', 'Charter Number', 'University or college charter reference'),
  ('SECP', 'SECP Registration', 'Securities and Exchange Commission registration'),
  ('OTHER', 'Other', 'Other institutional identifier')
ON CONFLICT (code) DO NOTHING;
