/**
 * Reglas del formulario de pedido de la tienda pública.
 *
 * Son un espejo de las validaciones de create_public_order. El servidor sigue
 * siendo la autoridad: esto solo existe para que el visitante corrija antes de
 * enviar, en vez de recibir un rechazo genérico con el formulario ya cerrado.
 *
 * Vive en un módulo compartido a propósito. TiendaPublica y ProductoDetalle
 * tienen dos modales distintos con el mismo flujo, y tenerlo duplicado ya causó
 * una vez que un arreglo se aplicara solo a uno de los dos.
 */

export type PublicOrderField = "nombre" | "telefono" | "direccion" | "notas" | "quantity";
export type PublicOrderErrors = Partial<Record<PublicOrderField, string>>;

export interface PublicOrderFields {
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  quantity: number;
}

/** Mismo patrón que acepta la función en la base. */
const PHONE_RE = /^[0-9+][0-9 +-]*$/;

/**
 * Deja solo dígitos, conservando un "+" inicial si lo hay.
 * "(300) 123-4567" → "3001234567" · "+57 300.123.4567" → "+573001234567"
 */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function validatePublicOrder(f: PublicOrderFields): PublicOrderErrors {
  const errors: PublicOrderErrors = {};

  const nombre = f.nombre.trim();
  if (nombre.length < 2) {
    errors.nombre = "Escribe tu nombre completo (mínimo 2 caracteres).";
  } else if (nombre.length > 120) {
    errors.nombre = "El nombre es demasiado largo (máximo 120 caracteres).";
  }

  const telefono = normalizePhone(f.telefono);
  if (telefono.length < 7) {
    errors.telefono = "El teléfono debe tener al menos 7 dígitos.";
  } else if (telefono.length > 20) {
    errors.telefono = "El teléfono es demasiado largo (máximo 20 dígitos).";
  } else if (!PHONE_RE.test(telefono)) {
    errors.telefono = "Usa solo números, con el código de país si aplica.";
  }

  const direccion = f.direccion.trim();
  if (direccion.length < 5) {
    errors.direccion = "Escribe una dirección completa (mínimo 5 caracteres).";
  } else if (direccion.length > 300) {
    errors.direccion = "La dirección es demasiado larga (máximo 300 caracteres).";
  }

  if (f.notas.trim().length > 500) {
    errors.notas = "Las notas son demasiado largas (máximo 500 caracteres).";
  }

  if (!Number.isInteger(f.quantity) || f.quantity < 1) {
    errors.quantity = "La cantidad debe ser al menos 1.";
  } else if (f.quantity > 100) {
    errors.quantity = "La cantidad máxima por pedido es 100.";
  }

  return errors;
}

/**
 * create_public_order marca TODOS sus errores de validación con SQLSTATE 22023.
 * Sirve para distinguir "el visitante puede corregir esto" de un fallo
 * transitorio (red, permisos, 500), que se maneja de otra forma.
 */
export function isValidationError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "22023";
}
