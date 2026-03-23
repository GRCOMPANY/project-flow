/**
 * Hook principal para el Módulo de Tareas Operativas
 *
 * Funcionalidades:
 * - CRUD completo de tareas
 * - Sincronización de tareas automáticas
 * - Deduplicación
 * - Resolución automática cuando condiciones cambian
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  OperationalTask,
  CreateTaskInput,
  CreateTaskOutcomeInput,
  TaskStatus,
  TaskType,
  TaskImpact,
  TaskOutcome,
  OutcomeStats,
  Priority,
  Sale,
  Product,
  Creative,
} from "@/types";
import { generateAllTasks, checkTaskStillApplies, GeneratedTask } from "@/lib/taskRules";
import { useSales } from "./useSales";
import { useProducts } from "./useProducts";
import { useCreatives } from "./useCreatives";
import { useToast } from "./use-toast";
import { useCompany } from "./useCompany";

const priorityOrder: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

// Mapeo de status del DB a nuestro tipo
const mapDbStatus = (status: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    pendiente: "pendiente",
    en_progreso: "en_progreso",
    terminada: "completada",
  };
  return statusMap[status] || "pendiente";
};

// Mapeo inverso para guardar en DB
const mapStatusToDb = (status: TaskStatus): string => {
  const statusMap: Record<TaskStatus, string> = {
    pendiente: "pendiente",
    en_progreso: "en_progreso",
    esperando_respuesta: "en_progreso",
    programada: "pendiente",
    completada: "terminada",
    cancelada: "terminada",
    resuelta_automaticamente: "terminada",
  };
  return statusMap[status];
};

export function useTasks() {
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Datos para generación automática
  const { sales } = useSales();
  const { products } = useProducts();
  const { creatives } = useCreatives();

  // Cargar tareas de la base de datos
  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          related_product:products(id, name, image_url, status),
          related_sale:sales(id, client_name, total_amount, payment_status),
          related_creative:creatives(id, title, type, status),
          assigned_user:profiles(id, full_name, avatar_url),
          outcome:task_outcomes(*)
        `,
        )
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedTasks: OperationalTask[] = (data || []).map((task: any) => {
        // Map outcome if exists (it's an array from the join, take first)
        const outcomeData = task.outcome?.[0];
        const outcome: TaskOutcome | undefined = outcomeData
          ? {
              id: outcomeData.id,
              taskId: outcomeData.task_id,
              result: outcomeData.result,
              generatedIncome: outcomeData.generated_income,
              incomeAmount: parseFloat(outcomeData.income_amount) || 0,
              notes: outcomeData.notes,
              completedBy: outcomeData.completed_by,
              completedAt: outcomeData.completed_at,
              createdAt: outcomeData.created_at,
            }
          : undefined;

        return {
          id: task.id,
          name: task.name,
          description: task.description,
          type: (task.type as TaskType) || "operacion",
          status: mapDbStatus(task.status),
          priority: task.priority as Priority,
          triggerReason: task.trigger_reason || task.reason || "Tarea del sistema",
          consequence: task.consequence,
          impact: (task.impact as TaskImpact) || "operacion",
          actionLabel: task.action_label || "Completar",
          actionPath: task.action_path,
          relatedSaleId: task.related_sale_id,
          relatedSale: task.related_sale,
          relatedProductId: task.related_product_id,
          relatedProduct: task.related_product,
          relatedCreativeId: task.related_creative_id,
          relatedCreative: task.related_creative,
          source: task.source || "manual",
          dedupKey: task.dedup_key,
          resolvedAt: task.resolved_at,
          resolvedBy: task.resolved_by,
          resolutionNotes: task.resolution_notes,
          dueDate: task.due_date,
          assignedTo: task.assigned_to,
          assignedUser: task.assigned_user,
          context: task.context,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          outcome,
        };
      });

      setTasks(mappedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Sincronizar tareas automáticas
  const syncAutomaticTasks = useCallback(async () => {
    if (syncing || (!sales.length && !products.length)) return;

    setSyncing(true);
    try {
      // 1. Generar tareas basadas en reglas
      const generatedTasks = generateAllTasks(sales, products, creatives);

      // 2. Obtener tareas automáticas existentes
      const automaticTasks = tasks.filter((t) => t.source === "automatic");
      const existingDedupKeys = new Set(automaticTasks.map((t) => t.dedupKey).filter(Boolean));

      // 3. Crear nuevas tareas que no existen
      const newTasks = generatedTasks.filter((t) => !existingDedupKeys.has(t.dedupKey));

      for (const task of newTasks) {
        const { error: insertError } = await supabase.from("tasks").insert({
          name: task.name,
          description: task.description,
          priority: task.priority,
          trigger_reason: task.triggerReason,
          consequence: task.consequence,
          action_label: task.actionLabel,
          action_path: task.actionPath,
          related_sale_id: task.relatedSaleId || null,
          related_product_id: task.relatedProductId || null,
          related_creative_id: task.relatedCreativeId || null,
          source: "automatic" as const,
          dedup_key: task.dedupKey,
          context: (task.context || {}) as Json,
          status: "pendiente" as const,
        });

        if (insertError && !insertError.message.includes("duplicate key")) {
          console.error("Error creating automatic task:", insertError);
        }
      }

      // 4. Cerrar tareas que ya no aplican
      for (const task of automaticTasks) {
        if (task.status === "completada" || task.status === "cancelada" || task.status === "resuelta_automaticamente") {
          continue;
        }

        const stillApplies = checkTaskStillApplies(task, sales, products, creatives);

        if (!stillApplies) {
          await supabase
            .from("tasks")
            .update({
              status: "terminada",
              resolved_at: new Date().toISOString(),
              resolution_notes: "Resuelta automáticamente: la condición ya no aplica",
            })
            .eq("id", task.id);
        }
      }

      // 5. Refrescar lista
      await fetchTasks();
    } catch (error) {
      console.error("Error syncing automatic tasks:", error);
    } finally {
      setSyncing(false);
    }
  }, [tasks, sales, products, creatives, syncing, fetchTasks]);

  // Crear tarea manual
  const createTask = async (input: CreateTaskInput): Promise<boolean> => {
    try {
      const { error } = await supabase.from("tasks").insert({
        name: input.name,
        description: input.description,
        type: input.type,
        priority: input.priority,
        impact: input.impact,
        trigger_reason: input.triggerReason,
        consequence: input.consequence,
        action_label: input.actionLabel,
        action_path: input.actionPath,
        related_sale_id: input.relatedSaleId,
        related_product_id: input.relatedProductId,
        related_creative_id: input.relatedCreativeId,
        due_date: input.dueDate,
        assigned_to: input.assignedTo,
        source: "manual",
        status: "pendiente",
      });

      if (error) throw error;

      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado correctamente",
      });

      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea",
        variant: "destructive",
      });
      return false;
    }
  };

  // Actualizar estado de tarea
  const updateTaskStatus = async (id: string, status: TaskStatus): Promise<boolean> => {
    try {
      const dbStatus = mapStatusToDb(status);
      const updates: Record<string, any> = { status: dbStatus };

      if (status === "completada" || status === "cancelada" || status === "resuelta_automaticamente") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase.from("tasks").update(updates).eq("id", id);

      if (error) throw error;

      // Actualizar localmente
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, resolvedAt: updates.resolved_at } : t)));

      return true;
    } catch (error: any) {
      console.error("UPDATE TASK ERROR FULL:", error);

      toast({
        title: `Error ${error?.code || ""}`,
        description: error?.message || "Error desconocido",
        variant: "destructive",
      });

      return false;
    }
  };

  // Resolver tarea con notas
  const resolveTask = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "terminada",
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Tarea completada",
        description: "La tarea se ha marcado como completada",
      });

      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error resolving task:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive",
      });
      return false;
    }
  };

  // Descartar/cancelar tarea
  const dismissTask = async (id: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "terminada",
          resolved_at: new Date().toISOString(),
          resolution_notes: `Cancelada: ${reason}`,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Tarea descartada",
        description: "La tarea se ha descartado",
      });

      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error dismissing task:", error);
      return false;
    }
  };

  // Completar tarea con outcome
  const completeWithOutcome = async (input: CreateTaskOutcomeInput): Promise<boolean> => {
    try {
      // 1. Crear el outcome
      const { error: outcomeError } = await supabase.from("task_outcomes").insert({
        task_id: input.taskId,
        result: input.result,
        generated_income: input.generatedIncome,
        income_amount: input.incomeAmount || 0,
        notes: input.notes,
      });

      if (outcomeError) throw outcomeError;

      // 2. Marcar tarea como completada
      const { error: taskError } = await supabase
        .from("tasks")
        .update({
          status: "terminada",
          resolved_at: new Date().toISOString(),
          resolution_notes: input.notes || `Cerrada: ${input.result}`,
        })
        .eq("id", input.taskId);

      if (taskError) throw taskError;

      toast({
        title: "Tarea completada",
        description: input.generatedIncome
          ? `Registrado ingreso de $${(input.incomeAmount || 0).toLocaleString()}`
          : "El resultado ha sido registrado",
      });

      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error("COMPLETE TASK FULL ERROR:", error);

      toast({
        title: `Error ${error?.code || ""}`,
        description: error?.message || JSON.stringify(error),
        variant: "destructive",
      });

      return false;
    }
  };

  // Cargar tareas al montar
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Sincronizar tareas automáticas cuando cambian los datos
  useEffect(() => {
    if (!loading && (sales.length > 0 || products.length > 0)) {
      const timer = setTimeout(() => {
        syncAutomaticTasks();
      }, 1000); // Debounce para evitar múltiples sincronizaciones
      return () => clearTimeout(timer);
    }
  }, [sales, products, creatives, loading]);

  // Filtros útiles
  const activeTasks = useMemo(
    () => tasks.filter((t) => !["completada", "cancelada", "resuelta_automaticamente"].includes(t.status)),
    [tasks],
  );

  const todayTasks = useMemo(
    () =>
      activeTasks
        .filter((t) => t.status === "pendiente")
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 5),
    [activeTasks],
  );

  const pendingCollections = useMemo(
    () => activeTasks.filter((t) => t.type === "cobro" && t.status === "pendiente"),
    [activeTasks],
  );

  const tasksByType = useMemo(() => {
    const grouped: Record<TaskType, OperationalTask[]> = {
      cobro: [],
      seguimiento_venta: [],
      creativo: [],
      operacion: [],
      estrategia: [],
    };
    for (const task of activeTasks) {
      if (task.type && grouped[task.type]) {
        grouped[task.type].push(task);
      }
    }
    return grouped;
  }, [activeTasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pendiente").length,
      inProgress: tasks.filter((t) => t.status === "en_progreso").length,
      completed: tasks.filter((t) => t.status === "completada").length,
      cancelled: tasks.filter((t) => t.status === "cancelada").length,
      highPriority: activeTasks.filter((t) => t.priority === "alta").length,
    }),
    [tasks, activeTasks],
  );

  // Estadísticas de outcomes del día
  const outcomeStats = useMemo((): OutcomeStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = tasks.filter((t) => t.outcome && new Date(t.outcome.completedAt) >= today);

    const withIncome = completedToday.filter((t) => t.outcome?.generatedIncome);

    const totalRecovered = withIncome.reduce((sum, t) => sum + (t.outcome?.incomeAmount || 0), 0);

    return {
      completedToday: completedToday.length,
      withIncome: withIncome.length,
      totalRecovered,
    };
  }, [tasks]);

  return {
    // Data
    tasks,
    activeTasks,
    todayTasks,
    pendingCollections,
    tasksByType,
    stats,
    outcomeStats,

    // State
    loading,
    syncing,

    // Actions
    createTask,
    updateTaskStatus,
    resolveTask,
    dismissTask,
    completeWithOutcome,
    refetch: fetchTasks,
    syncNow: syncAutomaticTasks,
  };
}
