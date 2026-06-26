-- Training courses + testimonials (run once in Supabase SQL Editor)
-- Requires 019_current_user_role_from_db.sql first

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_days INTEGER NOT NULL DEFAULT 1,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('full_arch', 'maxilla_for_all', 'implantology', 'surgery', 'prosthetics', 'other')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  instructor_name TEXT,
  instructor_bio TEXT,
  image_url TEXT,
  hubspot_form_code TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS course_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_title TEXT,
  feedback TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_start_date ON courses(start_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_course_testimonials_course_id ON course_testimonials(course_id);

CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published courses" ON courses;
CREATE POLICY "Public can view published courses"
  ON courses FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Public can view testimonials" ON course_testimonials;
CREATE POLICY "Public can view testimonials"
  ON course_testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_testimonials.course_id
        AND courses.is_published = true
        AND courses.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Admin full access to courses" ON courses;
DROP POLICY IF EXISTS "Staff and admin full access to courses" ON courses;
CREATE POLICY "Staff and admin full access to courses"
  ON courses FOR ALL
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admin full access to testimonials" ON course_testimonials;
DROP POLICY IF EXISTS "Staff and admin full access to course_testimonials" ON course_testimonials;
CREATE POLICY "Staff and admin full access to course_testimonials"
  ON course_testimonials FOR ALL
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));
