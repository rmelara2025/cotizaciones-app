/**
 * RUT (Rol Único Tributario) utilities for Chilean ID numbers
 * Provides validation, formatting, and cleaning functions
 */

/**
 * Validate RUT format and check digit
 * Supports formats: 12345678-9, 12.345.678-9, 123456789
 */
export function validateRut(rut: string): boolean {
  if (!rut) return false;

  // Clean: remove dots and hyphens, convert to uppercase
  const clean = rut.replace(/\./g, '').replace('-', '').toUpperCase();

  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  let dv = clean.slice(-1);

  // Validate body is numeric
  if (!/^\d+$/.test(body)) return false;

  // Calculate check digit using modulo 11
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const expectedDv = 11 - remainder;

  let calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === calculatedDv;
}

/**
 * Format RUT to standard format: XX.XXX.XXX-K
 */
export function formatRut(rut: string): string {
  if (!rut) return '';

  const cleaned = rut.replace(/[.-]/g, '');

  if (cleaned.length < 2) return rut;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (body.length === 0) return rut;

  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

/**
 * Clean RUT: remove formatting (dots, spaces, non-breaking spaces), keep hyphen separator
 * Format: XXXXXXXX-K (no dots, no spaces)
 */
export function cleanRut(rut: string): string {
  // Remove dots, regular spaces, non-breaking spaces (U+00A0), and other whitespace
  return rut.replace(/\./g, '').replace(/\s/g, '').replace(/\u00A0/g, '');
}

/**
 * Get RUT body (numeric part without check digit)
 */
export function getRutBody(rut: string): string {
  const clean = rut.replace(/[.-]/g, '');
  return clean.slice(0, -1);
}

/**
 * Get RUT check digit
 */
export function getRutCheckDigit(rut: string): string {
  const clean = rut.replace(/[.-]/g, '').toUpperCase();
  return clean.slice(-1);
}

/**
 * Check if input is valid RUT character (digit or K/k)
 */
export function isValidRutCharacter(char: string): boolean {
  return /[0-9kK]/.test(char);
}
