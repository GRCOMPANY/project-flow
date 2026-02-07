/**
 * CreativeFileUploader - Componente de gestión de archivos para creativos
 * 
 * Features:
 * - Drag and drop para subir archivos
 * - Preview de imágenes y videos
 * - Selector de rol (principal/variacion/referencia)
 * - Selector de estado (borrador/publicado/descartado)
 * - Campo de canal y notas
 * - Barra de progreso durante upload
 * - Lista de archivos con acciones de editar/eliminar
 */

import { useState, useCallback, useEffect } from 'react';
import { useCreativeFiles } from '@/hooks/useCreativeFiles';
import { CreativeFile, CreativeFileRole, CreativeFileStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Edit2,
  X,
  FileWarning,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreativeFileUploaderProps {
  creativeId: string;
  disabled?: boolean;
}

const ROLE_OPTIONS: { value: CreativeFileRole; label: string; color: string }[] = [
  { value: 'principal', label: '🟢 Principal', color: 'bg-emerald-500' },
  { value: 'variacion', label: '🔵 Variación', color: 'bg-blue-500' },
  { value: 'referencia', label: '⚪ Referencia', color: 'bg-slate-400' },
];

const STATUS_OPTIONS: { value: CreativeFileStatus; label: string; icon: typeof Clock }[] = [
  { value: 'borrador', label: 'Borrador', icon: Clock },
  { value: 'publicado', label: 'Publicado', icon: CheckCircle },
  { value: 'descartado', label: 'Descartado', icon: XCircle },
];

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function CreativeFileUploader({ creativeId, disabled = false }: CreativeFileUploaderProps) {
  const {
    files,
    loading,
    uploading,
    uploadProgress,
    fetchFiles,
    uploadFile,
    updateFile,
    deleteFile,
  } = useCreativeFiles();

  const [isDragging, setIsDragging] = useState(false);
  const [editingFile, setEditingFile] = useState<CreativeFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CreativeFile | null>(null);
  const [editForm, setEditForm] = useState({
    fileRole: 'principal' as CreativeFileRole,
    status: 'borrador' as CreativeFileStatus,
    channelUsed: '',
    notes: '',
  });

  // Fetch files on mount
  useEffect(() => {
    if (creativeId) {
      fetchFiles(creativeId);
    }
  }, [creativeId, fetchFiles]);

  const validateFile = (file: File): string | null => {
    const allTypes = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video];
    if (!allTypes.includes(file.type)) {
      return 'Formato no soportado. Usa JPG, PNG, WEBP, GIF, MP4, MOV o WEBM.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo es muy grande. Máximo 50MB.';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || uploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      const error = validateFile(file);
      if (!error) {
        await uploadFile(creativeId, file);
      }
    }
  }, [creativeId, disabled, uploading, uploadFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || uploading || !e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    for (const file of selectedFiles) {
      const error = validateFile(file);
      if (!error) {
        await uploadFile(creativeId, file);
      }
    }
    e.target.value = '';
  };

  const handleEditClick = (file: CreativeFile) => {
    setEditingFile(file);
    setEditForm({
      fileRole: file.fileRole,
      status: file.status,
      channelUsed: file.channelUsed || '',
      notes: file.notes || '',
    });
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    await updateFile(editingFile.id, editForm);
    setEditingFile(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await deleteFile(deleteConfirm.id, deleteConfirm.fileUrl);
    setDeleteConfirm(null);
  };

  const getRoleBadge = (role: CreativeFileRole) => {
    const option = ROLE_OPTIONS.find(r => r.value === role);
    return (
      <Badge variant="outline" className="text-xs">
        {option?.label || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: CreativeFileStatus) => {
    const StatusIcon = STATUS_OPTIONS.find(s => s.value === status)?.icon || Clock;
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs",
          status === 'publicado' && "border-success text-success",
          status === 'descartado' && "border-muted-foreground text-muted-foreground",
        )}
      >
        <StatusIcon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50",
          (disabled || uploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          accept={[...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video].join(',')}
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center text-center">
          <Upload className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para subir'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, GIF, MP4, MOV, WEBM • Máximo 50MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subiendo archivo...</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              📎 Archivos cargados ({files.length})
            </h4>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors"
              >
                {/* Preview */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {file.fileType === 'imagen' ? (
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-1">
                    {file.fileName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getRoleBadge(file.fileRole)}
                    {getStatusBadge(file.status)}
                  </div>
                  {file.channelUsed && (
                    <p className="text-xs text-muted-foreground">
                      📍 {file.channelUsed}
                    </p>
                  )}
                  {file.notes && (
                    <p className="text-xs text-muted-foreground truncate">
                      📝 {file.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!disabled && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(file)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(file)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Files Warning */}
      {files.length === 0 && !uploading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning">
          <FileWarning className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Este creativo no tiene archivos. Sube al menos una imagen o video.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar archivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rol del archivo</Label>
              <Select
                value={editForm.fileRole}
                onValueChange={(v) => setEditForm({ ...editForm, fileRole: v as CreativeFileRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v as CreativeFileStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Canal donde se usó</Label>
              <Input
                value={editForm.channelUsed}
                onChange={(e) => setEditForm({ ...editForm, channelUsed: e.target.value })}
                placeholder="Ej: Historia IG, Facebook Ads, TikTok..."
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notas adicionales sobre este archivo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFile(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente "{deleteConfirm?.fileName}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
