import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreativeFile, CreativeFileRole, CreativeFileStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UseCreativeFilesReturn {
  files: CreativeFile[];
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  fetchFiles: (creativeId: string) => Promise<CreativeFile[]>;
  uploadFile: (
    creativeId: string,
    file: File,
    role?: CreativeFileRole,
    status?: CreativeFileStatus,
    channelUsed?: string,
    notes?: string
  ) => Promise<CreativeFile | null>;
  updateFile: (fileId: string, updates: Partial<Pick<CreativeFile, 'fileRole' | 'status' | 'channelUsed' | 'notes'>>) => Promise<boolean>;
  deleteFile: (fileId: string, fileUrl: string) => Promise<boolean>;
}

const mapCreativeFile = (row: Record<string, unknown>): CreativeFile => ({
  id: row.id as string,
  creativeId: row.creative_id as string,
  fileUrl: row.file_url as string,
  fileName: row.file_name as string,
  fileType: row.file_type as CreativeFile['fileType'],
  fileRole: row.file_role as CreativeFile['fileRole'],
  status: row.status as CreativeFile['status'],
  channelUsed: row.channel_used as string | undefined,
  notes: row.notes as string | undefined,
  uploadedBy: row.uploaded_by as string | undefined,
  uploadedAt: row.uploaded_at as string,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export function useCreativeFiles(): UseCreativeFilesReturn {
  const [files, setFiles] = useState<CreativeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const fetchFiles = useCallback(async (creativeId: string): Promise<CreativeFile[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creative_files')
        .select('*')
        .eq('creative_id', creativeId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los archivos',
          variant: 'destructive',
        });
        return [];
      }

      const mappedFiles = (data || []).map(row => mapCreativeFile(row as Record<string, unknown>));
      setFiles(mappedFiles);
      return mappedFiles;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadFile = useCallback(async (
    creativeId: string,
    file: File,
    role: CreativeFileRole = 'principal',
    status: CreativeFileStatus = 'borrador',
    channelUsed?: string,
    notes?: string
  ): Promise<CreativeFile | null> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. Determine file type
      const isVideo = file.type.startsWith('video/');
      const fileType = isVideo ? 'video' : 'imagen';

      // 3. Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${creativeId}/${crypto.randomUUID()}.${fileExt}`;

      setUploadProgress(20);

      // 4. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('creatives')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        toast({
          title: 'Error de subida',
          description: uploadError.message || 'No se pudo subir el archivo',
          variant: 'destructive',
        });
        return null;
      }

      setUploadProgress(60);

      // 5. Get public URL
      const { data: urlData } = supabase.storage
        .from('creatives')
        .getPublicUrl(fileName);

      // 6. Create database record
      const { data, error: dbError } = await supabase
        .from('creative_files')
        .insert({
          creative_id: creativeId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: fileType as 'imagen' | 'video',
          file_role: role,
          status: status,
          channel_used: channelUsed || null,
          notes: notes || null,
          uploaded_by: user?.id || null,
        })
        .select()
        .single();

      if (dbError) {
        // Try to delete the uploaded file if DB insert fails
        await supabase.storage.from('creatives').remove([fileName]);
        toast({
          title: 'Error',
          description: 'No se pudo registrar el archivo',
          variant: 'destructive',
        });
        return null;
      }

      setUploadProgress(100);

      const creativeFile = mapCreativeFile(data as Record<string, unknown>);
      setFiles(prev => [creativeFile, ...prev]);

      toast({
        title: '✅ Archivo subido',
        description: `${file.name} se subió correctamente`,
      });

      return creativeFile;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error inesperado al subir el archivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [toast]);

  const updateFile = useCallback(async (
    fileId: string,
    updates: Partial<Pick<CreativeFile, 'fileRole' | 'status' | 'channelUsed' | 'notes'>>
  ): Promise<boolean> => {
    const updateData: Record<string, unknown> = {};
    if (updates.fileRole !== undefined) updateData.file_role = updates.fileRole;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.channelUsed !== undefined) updateData.channel_used = updates.channelUsed;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('creative_files')
      .update(updateData)
      .eq('id', fileId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el archivo',
        variant: 'destructive',
      });
      return false;
    }

    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, ...updates }
          : f
      )
    );

    toast({ title: 'Archivo actualizado' });
    return true;
  }, [toast]);

  const deleteFile = useCallback(async (fileId: string, fileUrl: string): Promise<boolean> => {
    // Extract file path from URL
    const urlParts = fileUrl.split('/creatives/');
    const filePath = urlParts.length > 1 ? urlParts[1] : null;

    // Delete from database first
    const { error: dbError } = await supabase
      .from('creative_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el registro',
        variant: 'destructive',
      });
      return false;
    }

    // Then delete from storage
    if (filePath) {
      await supabase.storage.from('creatives').remove([filePath]);
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));

    toast({ title: 'Archivo eliminado' });
    return true;
  }, [toast]);

  return {
    files,
    loading,
    uploading,
    uploadProgress,
    fetchFiles,
    uploadFile,
    updateFile,
    deleteFile,
  };
}
