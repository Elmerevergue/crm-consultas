import { supabase } from './supabase';

export const attachmentsAPI = {
  getByEmpresa: async (empresaId: string) => {
    const { data, error } = await supabase
      .from('attachments')
      .select('*, uploader:team_members(name)')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((a: Record<string, unknown>) => {
      const up = a.uploader as Record<string, string> | null;
      const { uploader, ...rest } = a;
      return { ...rest, uploader_name: up?.name ?? null };
    });
  },

  upload: async (empresaId: string, file: File, uploadedBy: string | null) => {
    const ext = file.name.split('.').pop();
    const path = `${empresaId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        empresa_id: empresaId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string, filePath?: string) => {
    if (filePath) {
      await supabase.storage.from('attachments').remove([filePath]);
    }
    const { error } = await supabase.from('attachments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
