// Security and Sanitization Utilities for ArenaMind AI (OWASP Guidelines)

/**
 * Sanitizes input strings by converting active HTML and script tags into encoded characters,
 * preventing cross-site scripting (XSS) injections in chat forms and logs.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  let sanitized = input.trim();
  
  // HTML tags sanitization
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Encode characters
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  const reg = /[&<>"'/]/ig;
  return sanitized.replace(reg, (match) => map[match]);
}

/**
 * Validates email structures before form submission
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.toLowerCase().trim());
}

/**
 * Verifies that required fields are present
 */
export function validateRequiredFields(fields: Record<string, string>): string | null {
  for (const [key, val] of Object.entries(fields)) {
    if (!val || !val.trim()) {
      return `The field '${key}' is required and cannot be empty.`;
    }
  }
  return null;
}
