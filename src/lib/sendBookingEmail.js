import { supabase } from './supabase';

/**
 * Sends a booking confirmation email via the send-booking-email Edge Function (Resend).
 * Fails silently so booking creation is never blocked.
 */
export async function sendBookingEmail({ to, subject, body }) {
  const { error } = await supabase.functions.invoke('send-booking-email', {
    body: { to, subject, body },
  });
  if (error) throw error;
}
