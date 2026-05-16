-- Function to get email by phone number (publicly accessible for login)
CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres)
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM public.profiles
  WHERE phone_number = p_phone
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- Grant access to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(TEXT) TO anon, authenticated;
