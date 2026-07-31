import { createClient } from '@supabase/supabase-js';

let _admin = null;
export function getAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _admin;
}
// Proxy so existing code still works
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) { return getAdmin()[prop]; }
});