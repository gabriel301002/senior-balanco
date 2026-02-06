import { supabase } from '@/integrations/supabase/client';

export const uploadImage = async (
  file: File,
  bucket: 'produto-fotos' | 'mantimento-fotos'
): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

export const deleteImage = async (
  url: string,
  bucket: 'produto-fotos' | 'mantimento-fotos'
): Promise<boolean> => {
  // Extract filename from URL
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];

  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
};
