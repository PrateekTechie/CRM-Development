import { getSupabaseClient } from './supabase';

const QUOTATION_BUCKET = 'lead-quotations';
const SIGNED_URL_EXPIRY_SECONDS = 60;

export const openLeadQuotationAttachment = async (leadId, path) => {
  const attachmentWindow = window.open('about:blank', '_blank');
  if (!attachmentWindow) {
    throw new Error('Allow pop-ups for this site to open the quotation attachment.');
  }
  attachmentWindow.opener = null;

  try {
    if (typeof path !== 'string' || !path.startsWith(`${leadId}/`)) {
      throw new Error('This quotation file is not linked to the selected lead.');
    }

    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Sign in to view this quotation attachment.');

    const { data: lead, error: leadError } = await client
      .from('leads')
      .select('quotation_attachment_path')
      .eq('id', leadId)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead || lead.quotation_attachment_path !== path) {
      throw new Error('You do not have permission to access this quotation attachment.');
    }

    const { data, error } = await client.storage
      .from(QUOTATION_BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Supabase did not return a signed link.');

    attachmentWindow.location.replace(data.signedUrl);
  } catch (error) {
    attachmentWindow.close();
    throw error;
  }
};
