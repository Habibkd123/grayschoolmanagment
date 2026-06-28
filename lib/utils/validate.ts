// ─── Simple, strict validation utility ────────────────────────────
// No external library needed — pure TypeScript

type FieldRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  isEmail?: boolean;
  isEnum?: string[];
  isMongoId?: boolean;
  match?: RegExp;
  matchMessage?: string;
};

type Schema = Record<string, FieldRule>;

export type ValidationError = { field: string; message: string };

export function validate(
  data: Record<string, unknown>,
  schema: Schema
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const strValue = typeof value === "string" ? value.trim() : "";

    // ── Required ──────────────────────────────────────────────────
    if (rules.required && (value === undefined || value === null || strValue === "")) {
      errors.push({ field, message: `${field} is required` });
      continue; // Skip further checks if missing
    }

    if (!value && !rules.required) continue; // Optional field, skip

    // ── Min length ────────────────────────────────────────────────
    if (rules.minLength && strValue.length < rules.minLength) {
      errors.push({
        field,
        message: `${field} must be at least ${rules.minLength} characters`,
      });
    }

    // ── Max length ────────────────────────────────────────────────
    if (rules.maxLength && strValue.length > rules.maxLength) {
      errors.push({
        field,
        message: `${field} must not exceed ${rules.maxLength} characters`,
      });
    }

    // ── Email ─────────────────────────────────────────────────────
    if (rules.isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(strValue)) {
        errors.push({ field, message: `${field} must be a valid email address` });
      }
    }

    // ── Enum ──────────────────────────────────────────────────────
    if (rules.isEnum && !rules.isEnum.includes(strValue)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rules.isEnum.join(", ")}`,
      });
    }

    // ── MongoDB ObjectId ──────────────────────────────────────────
    if (rules.isMongoId) {
      const mongoIdRegex = /^[a-f\d]{24}$/i;
      if (!mongoIdRegex.test(strValue)) {
        errors.push({ field, message: `${field} must be a valid ID` });
      }
    }

    // ── Custom regex ──────────────────────────────────────────────
    if (rules.match && !rules.match.test(strValue)) {
      errors.push({
        field,
        message: rules.matchMessage || `${field} format is invalid`,
      });
    }
  }

  return errors;
}

// ─── Helper: send validation error response ────────────────────────
import { NextResponse } from "next/server";

export function validationErrorResponse(errors: ValidationError[]) {
  return NextResponse.json(
    {
      success: false,
      message: "Validation failed",
      errors,
    },
    { status: 422 }
  );
}
