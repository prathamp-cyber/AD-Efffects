/**
 * Shared request validation and sanitization helpers.
 * Keep all user-controlled data checks close to the API boundary.
 */

export interface ValidationResult<T> {
  value: T;
  error?: string;
}

interface ConfigValidationResult {
  valid: boolean;
  value?: Record<string, unknown>;
  error?: string;
}

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
const HTML_TAG = /<\/?[a-z][\s\S]*>/i;
const EVENT_HANDLER = /\bon[a-z]+\s*=/i;
const SCRIPT_SCHEME = /(?:javascript|vbscript|data|file|blob)\s*:/i;
const PATH_TRAVERSAL = /(?:^|[\\/])\.\.(?:[\\/]|$)/;
const COMMAND_SUBSTITUTION = /(?:\$\(|`[^`]*`)/;
const COMMAND_CHAINING = /(?:^|[\s"'`])(?:;|&&|\|\|)(?:\s|$)/;
const SQLI_PATTERNS = [
  /(?:^|[\s'"])or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /(?:^|[\s'"])and\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /\bunion\s+(?:all\s+)?select\b/i,
  /\b(?:drop|alter|truncate|create)\s+(?:table|database|schema|index)\b/i,
  /\b(?:insert\s+into|delete\s+from|update\s+\w+\s+set)\b/i,
  /(?:--|#|\/\*)/,
];

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MIME_BY_EXTENSION: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
};

export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export function isBoolean(val: unknown): val is boolean {
  return typeof val === 'boolean';
}

export function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

export function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

export function sanitizeText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

export function containsInjection(input: string): boolean {
  if (!isString(input)) return false;

  return (
    HTML_TAG.test(input) ||
    EVENT_HANDLER.test(input) ||
    SCRIPT_SCHEME.test(input) ||
    PATH_TRAVERSAL.test(input) ||
    COMMAND_SUBSTITUTION.test(input) ||
    COMMAND_CHAINING.test(input) ||
    SQLI_PATTERNS.some((pattern) => pattern.test(input))
  );
}

export function validateString(
  val: unknown,
  fieldName: string,
  opts: { minLen?: number; maxLen?: number; required?: boolean; rejectInjection?: boolean } = {}
): ValidationResult<string> {
  const { minLen = 0, maxLen = 1000, required = true, rejectInjection = true } = opts;

  if (!isString(val)) {
    return required ? { value: '', error: `${fieldName} must be a string` } : { value: '' };
  }

  if (CONTROL_CHARS.test(val)) {
    return { value: '', error: `${fieldName} contains invalid control characters` };
  }

  const value = sanitizeText(val);

  if (required && value.length === 0) {
    return { value: '', error: `${fieldName} is required` };
  }

  if (value.length > maxLen) {
    return { value: '', error: `${fieldName} exceeds ${maxLen} characters` };
  }

  if (value.length > 0 && value.length < minLen) {
    return { value: '', error: `${fieldName} must be at least ${minLen} characters` };
  }

  if (rejectInjection && containsInjection(value)) {
    return { value: '', error: `${fieldName} contains unsafe content` };
  }

  return { value };
}

export function validateEmail(val: unknown, fieldName = 'Email'): ValidationResult<string> {
  const result = validateString(val, fieldName, { maxLen: 254, rejectInjection: true });
  if (result.error) return result;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(result.value)) {
    return { value: '', error: `${fieldName} is not a valid email address` };
  }

  return { value: result.value.toLowerCase() };
}

export function validateUsername(val: unknown): ValidationResult<string> {
  const result = validateString(val, 'Username', { minLen: 1, maxLen: 100, rejectInjection: false });
  if (result.error) return result;
  if (!/^[a-zA-Z0-9._@-]+$/.test(result.value)) {
    return { value: '', error: 'Username contains invalid characters' };
  }
  return result;
}

export function validatePassword(val: unknown): ValidationResult<string> {
  return validateString(val, 'Password', { minLen: 1, maxLen: 200, rejectInjection: false });
}

export function validateId(val: unknown, fieldName = 'ID'): ValidationResult<string> {
  const result = validateString(val, fieldName, { minLen: 1, maxLen: 64, rejectInjection: false });
  if (result.error) return result;

  if (!/^[a-zA-Z0-9_-]+$/.test(result.value)) {
    return { value: '', error: `${fieldName} contains invalid characters` };
  }

  return result;
}

export function validateUrl(val: unknown, fieldName = 'URL', opts: { required?: boolean } = {}): ValidationResult<string> {
  const result = validateString(val, fieldName, {
    required: opts.required ?? false,
    maxLen: 2048,
    rejectInjection: true,
  });
  if (result.error || result.value === '') return result;

  const value = result.value;
  if (value.startsWith('/')) {
    if (!/^\/uploads\/[a-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(value)) {
      return { value: '', error: `${fieldName} must be an uploaded image path` };
    }
    return { value };
  }

  try {
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return { value: '', error: `${fieldName} must use http or https` };
    }
    if (!parsed.hostname || parsed.username || parsed.password) {
      return { value: '', error: `${fieldName} is not a safe URL` };
    }
    return { value: parsed.toString() };
  } catch {
    return { value: '', error: `${fieldName} is not a valid URL` };
  }
}

export function checkBodySize(request: Request, maxBytes = 512 * 1024): string | null {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return null;

  const parsed = Number(contentLength);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 'Invalid Content-Length header';
  }

  if (parsed > maxBytes) {
    return `Request body exceeds ${Math.round(maxBytes / 1024)}KB limit`;
  }

  return null;
}

export function validateJsonRequest(request: Request, maxBytes = 512 * 1024): string | null {
  const sizeError = checkBodySize(request, maxBytes);
  if (sizeError) return sizeError;

  const contentType = request.headers.get('content-type') || '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return 'Content-Type must be application/json';
  }

  return null;
}

export function validateMultipartRequest(request: Request, maxBytes: number): string | null {
  const sizeError = checkBodySize(request, maxBytes);
  if (sizeError) return sizeError;

  const contentType = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data(?:\s*;|$)/i.test(contentType)) {
    return 'Content-Type must be multipart/form-data';
  }

  return null;
}

export function assertNoUnknownKeys(obj: Record<string, unknown>, allowed: readonly string[], path: string): string | null {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return `${path} contains an unsafe property`;
    }
    if (!allowedSet.has(key)) {
      return `${path}.${key} is not allowed`;
    }
  }
  return null;
}

export function deepSanitize<T>(obj: T, maxDepth = 10): T {
  if (maxDepth <= 0) return obj;
  if (isString(obj)) return sanitizeText(stripHtml(obj)) as unknown as T;
  if (isArray(obj)) return obj.map((item) => deepSanitize(item, maxDepth - 1)) as unknown as T;
  if (isObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      result[key] = deepSanitize(value, maxDepth - 1);
    }
    return result as T;
  }
  return obj;
}

function validateTextField(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  opts: { minLen?: number; maxLen: number; required?: boolean } = { maxLen: 1000 }
): ValidationResult<string> {
  return validateString(obj[key], `${path}.${key}`, opts);
}

function validateUrlField(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  opts: { required?: boolean } = {}
): ValidationResult<string> {
  return validateUrl(obj[key], `${path}.${key}`, opts);
}

function validateTextArray(val: unknown, path: string, opts: { maxItems: number; maxLen: number; required?: boolean }): ValidationResult<string[]> {
  if (!isArray(val)) {
    return { value: [], error: `${path} must be an array` };
  }
  if (val.length > opts.maxItems) {
    return { value: [], error: `${path} exceeds ${opts.maxItems} items` };
  }

  const values: string[] = [];
  for (let i = 0; i < val.length; i += 1) {
    const item = validateString(val[i], `${path}[${i}]`, {
      maxLen: opts.maxLen,
      required: opts.required ?? true,
    });
    if (item.error) return { value: [], error: item.error };
    values.push(item.value);
  }
  return { value: values };
}

function validateUrlArray(val: unknown, path: string, opts: { maxItems: number; required?: boolean }): ValidationResult<string[]> {
  if (!isArray(val)) {
    return { value: [], error: `${path} must be an array` };
  }
  if (val.length > opts.maxItems) {
    return { value: [], error: `${path} exceeds ${opts.maxItems} items` };
  }

  const values: string[] = [];
  for (let i = 0; i < val.length; i += 1) {
    const item = validateUrl(val[i], `${path}[${i}]`, { required: opts.required ?? true });
    if (item.error) return { value: [], error: item.error };
    values.push(item.value);
  }
  return { value: values };
}

function validateProject(raw: unknown, index: number): ValidationResult<Record<string, unknown>> {
  const path = `projects[${index}]`;
  if (!isObject(raw)) return { value: {}, error: `${path} must be an object` };

  const unknown = assertNoUnknownKeys(raw, ['id', 'title', 'category', 'location', 'image', 'year', 'size', 'detailImages', 'description'], path);
  if (unknown) return { value: {}, error: unknown };

  const id = validateId(raw.id, `${path}.id`);
  if (id.error) return { value: {}, error: id.error };
  const title = validateTextField(raw, 'title', path, { minLen: 1, maxLen: 200 });
  if (title.error) return { value: {}, error: title.error };
  const category = validateTextField(raw, 'category', path, { minLen: 1, maxLen: 120 });
  if (category.error) return { value: {}, error: category.error };
  const location = validateTextField(raw, 'location', path, { minLen: 1, maxLen: 160 });
  if (location.error) return { value: {}, error: location.error };
  const image = validateUrlField(raw, 'image', path, { required: true });
  if (image.error) return { value: {}, error: image.error };
  const year = validateString(raw.year, `${path}.year`, { minLen: 4, maxLen: 4, rejectInjection: false });
  if (year.error || !/^\d{4}$/.test(year.value)) return { value: {}, error: `${path}.year must be a four digit year` };
  const size = validateString(raw.size, `${path}.size`, { maxLen: 60, required: false });
  if (size.error) return { value: {}, error: size.error };
  const detailImages = validateUrlArray(raw.detailImages, `${path}.detailImages`, { maxItems: 20, required: true });
  if (detailImages.error) return { value: {}, error: detailImages.error };
  const description = validateString(raw.description, `${path}.description`, { maxLen: 2000, required: false });
  if (description.error) return { value: {}, error: description.error };

  return {
    value: {
      id: id.value,
      title: title.value,
      category: category.value,
      location: location.value,
      image: image.value,
      year: year.value,
      size: size.value,
      detailImages: detailImages.value,
      description: description.value,
    },
  };
}

function validatePressItem(raw: unknown, index: number): ValidationResult<Record<string, unknown>> {
  const path = `press[${index}]`;
  if (!isObject(raw)) return { value: {}, error: `${path} must be an object` };

  const unknown = assertNoUnknownKeys(raw, ['id', 'title', 'subtitle', 'image', 'link'], path);
  if (unknown) return { value: {}, error: unknown };

  const id = validateId(raw.id, `${path}.id`);
  if (id.error) return { value: {}, error: id.error };
  const title = validateTextField(raw, 'title', path, { minLen: 1, maxLen: 200 });
  if (title.error) return { value: {}, error: title.error };
  const subtitle = validateTextField(raw, 'subtitle', path, { minLen: 1, maxLen: 200 });
  if (subtitle.error) return { value: {}, error: subtitle.error };
  const image = validateUrlField(raw, 'image', path, { required: true });
  if (image.error) return { value: {}, error: image.error };
  const link = validateUrlField(raw, 'link', path, { required: true });
  if (link.error) return { value: {}, error: link.error };

  return { value: { id: id.value, title: title.value, subtitle: subtitle.value, image: image.value, link: link.value } };
}

function validateBlog(raw: unknown, index: number): ValidationResult<Record<string, unknown>> {
  const path = `blogs[${index}]`;
  if (!isObject(raw)) return { value: {}, error: `${path} must be an object` };

  const unknown = assertNoUnknownKeys(raw, ['id', 'title', 'excerpt', 'content', 'image', 'date', 'author'], path);
  if (unknown) return { value: {}, error: unknown };

  const id = validateId(raw.id, `${path}.id`);
  if (id.error) return { value: {}, error: id.error };
  const title = validateTextField(raw, 'title', path, { minLen: 1, maxLen: 300 });
  if (title.error) return { value: {}, error: title.error };
  const excerpt = validateTextField(raw, 'excerpt', path, { maxLen: 1000, required: false });
  if (excerpt.error) return { value: {}, error: excerpt.error };
  const content = validateTextField(raw, 'content', path, { maxLen: 50000, required: false });
  if (content.error) return { value: {}, error: content.error };
  const image = validateUrlField(raw, 'image', path, { required: false });
  if (image.error) return { value: {}, error: image.error };
  const date = validateString(raw.date, `${path}.date`, { minLen: 10, maxLen: 10, rejectInjection: false });
  if (date.error || !/^\d{4}-\d{2}-\d{2}$/.test(date.value)) return { value: {}, error: `${path}.date must be YYYY-MM-DD` };
  const author = validateTextField(raw, 'author', path, { maxLen: 120, required: false });
  if (author.error) return { value: {}, error: author.error };

  return {
    value: {
      id: id.value,
      title: title.value,
      excerpt: excerpt.value,
      content: content.value,
      image: image.value,
      date: date.value,
      author: author.value,
    },
  };
}

export function validateSiteConfig(config: unknown): ConfigValidationResult {
  if (!isObject(config)) {
    return { valid: false, error: 'Configuration must be a JSON object' };
  }

  const unknown = assertNoUnknownKeys(config, ['brandStatement', 'story', 'influence', 'press', 'projects', 'blogs', 'isWebsiteOffline'], 'config');
  if (unknown) return { valid: false, error: unknown };

  const brandStatement = validateString(config.brandStatement, 'brandStatement', { minLen: 1, maxLen: 700 });
  if (brandStatement.error) return { valid: false, error: brandStatement.error };

  if (!isObject(config.story)) return { valid: false, error: 'story must be an object' };
  const storyUnknown = assertNoUnknownKeys(config.story, ['title', 'paragraphs', 'images'], 'story');
  if (storyUnknown) return { valid: false, error: storyUnknown };
  const storyTitle = validateTextField(config.story, 'title', 'story', { minLen: 1, maxLen: 160 });
  if (storyTitle.error) return { valid: false, error: storyTitle.error };
  const storyParagraphs = validateTextArray(config.story.paragraphs, 'story.paragraphs', { maxItems: 10, maxLen: 1500 });
  if (storyParagraphs.error) return { valid: false, error: storyParagraphs.error };
  const storyImages = validateUrlArray(config.story.images, 'story.images', { maxItems: 10 });
  if (storyImages.error) return { valid: false, error: storyImages.error };

  if (!isObject(config.influence)) return { valid: false, error: 'influence must be an object' };
  const influenceUnknown = assertNoUnknownKeys(config.influence, ['title', 'description', 'image'], 'influence');
  if (influenceUnknown) return { valid: false, error: influenceUnknown };
  const influenceTitle = validateTextField(config.influence, 'title', 'influence', { minLen: 1, maxLen: 160 });
  if (influenceTitle.error) return { valid: false, error: influenceTitle.error };
  const influenceDescription = validateTextField(config.influence, 'description', 'influence', { minLen: 1, maxLen: 1500 });
  if (influenceDescription.error) return { valid: false, error: influenceDescription.error };
  const influenceImage = validateUrlField(config.influence, 'image', 'influence', { required: true });
  if (influenceImage.error) return { valid: false, error: influenceImage.error };

  if (!isArray(config.press) || config.press.length > 50) {
    return { valid: false, error: 'press must be an array with at most 50 items' };
  }
  const press = [];
  for (let i = 0; i < config.press.length; i += 1) {
    const item = validatePressItem(config.press[i], i);
    if (item.error) return { valid: false, error: item.error };
    press.push(item.value);
  }

  if (!isArray(config.projects) || config.projects.length > 100) {
    return { valid: false, error: 'projects must be an array with at most 100 items' };
  }
  const projects = [];
  for (let i = 0; i < config.projects.length; i += 1) {
    const item = validateProject(config.projects[i], i);
    if (item.error) return { valid: false, error: item.error };
    projects.push(item.value);
  }

  const blogs = [];
  if (config.blogs !== undefined) {
    if (!isArray(config.blogs) || config.blogs.length > 200) {
      return { valid: false, error: 'blogs must be an array with at most 200 items' };
    }
    for (let i = 0; i < config.blogs.length; i += 1) {
      const item = validateBlog(config.blogs[i], i);
      if (item.error) return { valid: false, error: item.error };
      blogs.push(item.value);
    }
  }

  if (config.isWebsiteOffline !== undefined && !isBoolean(config.isWebsiteOffline)) {
    return { valid: false, error: 'isWebsiteOffline must be a boolean' };
  }

  return {
    valid: true,
    value: {
      isWebsiteOffline: config.isWebsiteOffline === true,
      brandStatement: brandStatement.value,
      story: {
        title: storyTitle.value,
        paragraphs: storyParagraphs.value,
        images: storyImages.value,
      },
      influence: {
        title: influenceTitle.value,
        description: influenceDescription.value,
        image: influenceImage.value,
      },
      press,
      projects,
      blogs,
    },
  };
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 6) {
    const gif = buffer.subarray(0, 6).toString('ascii');
    if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export function validateFileUpload(
  file: File,
  buffer: Buffer,
  opts: { maxSizeBytes?: number } = {}
): ValidationResult<{ safeBaseName: string; extension: string; mime: string }> {
  const { maxSizeBytes = 10 * 1024 * 1024 } = opts;

  if (!(file instanceof File)) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'Uploaded file is invalid' };
  }
  if (file.size !== buffer.length) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'Uploaded file size mismatch' };
  }
  if (file.size <= 0) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'File is empty' };
  }
  if (file.size > maxSizeBytes) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: `File size exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit` };
  }

  const rawName = sanitizeText(file.name || '');
  if (!rawName || rawName.length > 180 || rawName.includes('/') || rawName.includes('\\') || PATH_TRAVERSAL.test(rawName)) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'Invalid file name' };
  }

  const extension = rawName.split('.').pop()?.toLowerCase() || '';
  if (!MIME_BY_EXTENSION[extension]) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.' };
  }

  if (!file.type || !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'Invalid MIME type. Only image files are allowed.' };
  }

  const detectedMime = detectImageMime(buffer);
  if (!detectedMime) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'File content does not match a valid image format' };
  }
  if (!MIME_BY_EXTENSION[extension].includes(detectedMime) || file.type !== detectedMime) {
    return { value: { safeBaseName: '', extension: '', mime: '' }, error: 'File extension, MIME type, and file content do not match' };
  }

  const base = rawName.replace(/\.[^.]+$/, '');
  const safeBaseName = base.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase().slice(0, 50) || 'image';

  return { value: { safeBaseName, extension, mime: detectedMime } };
}
