import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRut(rut: string): string {
  if (!rut) return "";
  rut = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  let rutSinDigito = rut.slice(0, -1);
  let digito = rut.slice(-1);
  let rutFormateado = "";
  while (rutSinDigito.length > 3) {
    rutFormateado = "." + rutSinDigito.slice(-3) + rutFormateado;
    rutSinDigito = rutSinDigito.slice(0, -3);
  }
  rutFormateado = rutSinDigito + rutFormateado;
  return rutFormateado + "-" + digito;
}