/**
 * THE VYBER - Form Agent
 * Intelligent form detection, analysis, and auto-filling
 *
 * Unlike Atlas's 10-minute shopping cart fiasco, FormAgent is fast and accurate
 */

import {
  BaseAgent,
  defineAgent,
  defineCapability,
  AgentRegistry,
} from '../core/AgentRegistry';
import type { Task, AgentConfig } from '../types';

// Capabilities
const DETECT_FORMS_CAPABILITY = defineCapability(
  'form.detect',
  'Detect Forms',
  'Detect and analyze forms on a page',
  ['dom.read']
);

const FILL_FORM_CAPABILITY = defineCapability(
  'form.fill',
  'Fill Form',
  'Intelligently fill form fields',
  ['dom.interact']
);

const SUBMIT_FORM_CAPABILITY = defineCapability(
  'form.submit',
  'Submit Form',
  'Submit a form',
  ['dom.interact']
);

const VALIDATE_FORM_CAPABILITY = defineCapability(
  'form.validate',
  'Validate Form',
  'Check form validation state',
  ['dom.read']
);

// Agent metadata
const FORM_AGENT_METADATA = defineAgent(
  'form-agent',
  'Form Agent',
  'Intelligently detects, analyzes, fills, and submits web forms',
  [
    DETECT_FORMS_CAPABILITY,
    FILL_FORM_CAPABILITY,
    SUBMIT_FORM_CAPABILITY,
    VALIDATE_FORM_CAPABILITY,
  ],
  {
    maxConcurrentTasks: 1,
    defaultTimeout: 60000, // Forms can be complex
  }
);

// Form field types we can handle
export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'url'
  | 'search'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'hidden'
  | 'submit'
  | 'button'
  | 'unknown';

// Detected form field
export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  value?: string;
  options?: string[]; // For select/radio
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: string;
  max?: string;
  selector: string;
  autocomplete?: string;
  inferredPurpose?: FieldPurpose;
}

// Inferred field purpose for smart filling
export type FieldPurpose =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'address'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'country'
  | 'company'
  | 'jobTitle'
  | 'username'
  | 'password'
  | 'confirmPassword'
  | 'creditCard'
  | 'cvv'
  | 'expiryDate'
  | 'birthDate'
  | 'message'
  | 'subject'
  | 'quantity'
  | 'search'
  | 'unknown';

// Detected form
export interface DetectedForm {
  id: string;
  name?: string;
  action?: string;
  method: string;
  fields: FormField[];
  submitButton?: {
    selector: string;
    text: string;
  };
  formType: FormType;
  selector: string;
}

// Form types we can identify
export type FormType =
  | 'login'
  | 'signup'
  | 'contact'
  | 'checkout'
  | 'search'
  | 'newsletter'
  | 'payment'
  | 'shipping'
  | 'profile'
  | 'comment'
  | 'unknown';

// Task payloads
interface DetectFormsPayload {
  selector?: string; // Optionally limit to specific container
}

interface FillFormPayload {
  formSelector: string;
  data: Record<string, string | boolean>;
  strategy?: 'exact' | 'smart' | 'ai'; // How to match fields to data
}

interface SubmitFormPayload {
  formSelector: string;
  waitForNavigation?: boolean;
}

interface ValidateFormPayload {
  formSelector: string;
}

// Field purpose detection patterns
const FIELD_PURPOSE_PATTERNS: Record<FieldPurpose, RegExp[]> = {
  firstName: [/first[-_]?name/i, /fname/i, /given[-_]?name/i, /^first$/i],
  lastName: [/last[-_]?name/i, /lname/i, /surname/i, /family[-_]?name/i, /^last$/i],
  fullName: [/full[-_]?name/i, /^name$/i, /your[-_]?name/i],
  email: [/email/i, /e[-_]?mail/i],
  phone: [/phone/i, /tel/i, /mobile/i, /cell/i],
  address: [/address/i, /street/i],
  addressLine1: [/address[-_]?1/i, /address[-_]?line[-_]?1/i, /street[-_]?1/i],
  addressLine2: [/address[-_]?2/i, /address[-_]?line[-_]?2/i, /apt/i, /suite/i, /unit/i],
  city: [/city/i, /town/i, /locality/i],
  state: [/state/i, /province/i, /region/i],
  zipCode: [/zip/i, /postal/i, /post[-_]?code/i],
  country: [/country/i, /nation/i],
  company: [/company/i, /organization/i, /business/i, /employer/i],
  jobTitle: [/job[-_]?title/i, /position/i, /role/i, /occupation/i],
  username: [/user[-_]?name/i, /^user$/i, /login/i, /^id$/i],
  password: [/password/i, /^pass$/i, /^pwd$/i],
  confirmPassword: [/confirm[-_]?password/i, /password[-_]?confirm/i, /re[-_]?password/i, /password[-_]?2/i],
  creditCard: [/card[-_]?number/i, /cc[-_]?number/i, /credit[-_]?card/i],
  cvv: [/cvv/i, /cvc/i, /security[-_]?code/i],
  expiryDate: [/expir/i, /exp[-_]?date/i],
  birthDate: [/birth/i, /dob/i, /birthday/i],
  message: [/message/i, /comment/i, /body/i, /content/i, /description/i],
  subject: [/subject/i, /title/i, /topic/i],
  quantity: [/quantity/i, /qty/i, /amount/i, /count/i],
  search: [/search/i, /query/i, /^q$/i, /keyword/i],
  unknown: [],
};

// Form type detection patterns
const FORM_TYPE_PATTERNS: Record<FormType, RegExp[]> = {
  login: [/login/i, /sign[-_]?in/i, /log[-_]?in/i],
  signup: [/sign[-_]?up/i, /register/i, /create[-_]?account/i, /join/i],
  contact: [/contact/i, /get[-_]?in[-_]?touch/i, /message[-_]?us/i],
  checkout: [/checkout/i, /payment/i, /purchase/i, /buy/i],
  search: [/search/i, /find/i, /query/i],
  newsletter: [/newsletter/i, /subscribe/i, /email[-_]?list/i],
  payment: [/payment/i, /billing/i, /credit[-_]?card/i],
  shipping: [/shipping/i, /delivery/i, /address/i],
  profile: [/profile/i, /account/i, /settings/i, /preferences/i],
  comment: [/comment/i, /reply/i, /review/i, /feedback/i],
  unknown: [],
};

/**
 * FormAgent - Intelligent form handling
 */
export class FormAgent extends BaseAgent {
  private iframeRef: HTMLIFrameElement | null = null;

  constructor(config?: Partial<AgentConfig>) {
    super({
      ...FORM_AGENT_METADATA,
      config: { ...FORM_AGENT_METADATA.config, ...config },
    });
  }

  setIframeRef(ref: HTMLIFrameElement | null): void {
    this.iframeRef = ref;
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'FormAgent initialized');
  }

  protected async onExecute(task: Task): Promise<unknown> {
    const actionType = task.type.replace('form.', '');
    const payload = task.payload as Record<string, unknown>;

    switch (actionType) {
      case 'detect':
        return this.handleDetectForms(payload as unknown as DetectFormsPayload);
      case 'fill':
        return this.handleFillForm(payload as unknown as FillFormPayload);
      case 'submit':
        return this.handleSubmitForm(payload as unknown as SubmitFormPayload);
      case 'validate':
        return this.handleValidateForm(payload as unknown as ValidateFormPayload);
      default:
        throw new Error(`Unknown form action: ${actionType}`);
    }
  }

  private getDocument(): Document {
    if (this.iframeRef?.contentDocument) {
      return this.iframeRef.contentDocument;
    }
    return document;
  }

  private getElement(selector: string): Element | null {
    try {
      return this.getDocument().querySelector(selector);
    } catch {
      return null;
    }
  }

  /**
   * Detect all forms on the page
   */
  private async handleDetectForms(payload: DetectFormsPayload): Promise<{ forms: DetectedForm[] }> {
    this.log('info', 'Detecting forms on page');
    this.setProgress(10);

    const container = payload.selector
      ? this.getElement(payload.selector)
      : this.getDocument().body;

    if (!container) {
      throw new Error('Container not found');
    }

    const formElements = container.querySelectorAll('form');
    const forms: DetectedForm[] = [];

    this.setProgress(30);

    formElements.forEach((form, index) => {
      const detectedForm = this.analyzeForm(form, index);
      forms.push(detectedForm);
    });

    // Also detect standalone inputs that might be form-like (search bars, etc.)
    const standaloneInputs = this.detectStandaloneInputs(container);
    forms.push(...standaloneInputs);

    this.setProgress(100);
    this.log('info', `Detected ${forms.length} forms`);

    return { forms };
  }

  /**
   * Analyze a form element
   */
  private analyzeForm(form: HTMLFormElement, index: number): DetectedForm {
    const fields: FormField[] = [];

    // Get all form inputs
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach((input, fieldIndex) => {
      const field = this.analyzeField(input, fieldIndex);
      if (field) {
        fields.push(field);
      }
    });

    // Find submit button
    const submitButton = this.findSubmitButton(form);

    // Determine form type
    const formType = this.determineFormType(form, fields);

    // Generate selector
    const selector = form.id
      ? `#${form.id}`
      : form.name
      ? `form[name="${form.name}"]`
      : `form:nth-of-type(${index + 1})`;

    return {
      id: form.id || `form-${index}`,
      name: form.name || undefined,
      action: form.action || undefined,
      method: form.method || 'GET',
      fields,
      submitButton,
      formType,
      selector,
    };
  }

  /**
   * Analyze a form field
   */
  private analyzeField(element: Element, index: number): FormField | null {
    if (element instanceof HTMLInputElement) {
      const type = this.mapInputType(element.type);

      // Skip hidden, submit, button types for analysis
      if (['hidden', 'submit', 'button'].includes(type)) {
        return null;
      }

      const label = this.findFieldLabel(element);
      const inferredPurpose = this.inferFieldPurpose(element, label);

      return {
        id: element.id || `field-${index}`,
        name: element.name,
        type,
        label,
        placeholder: element.placeholder,
        required: element.required,
        value: element.value,
        pattern: element.pattern || undefined,
        minLength: element.minLength > 0 ? element.minLength : undefined,
        maxLength: element.maxLength > 0 ? element.maxLength : undefined,
        min: element.min || undefined,
        max: element.max || undefined,
        selector: this.generateFieldSelector(element, index),
        autocomplete: element.autocomplete || undefined,
        inferredPurpose,
      };
    }

    if (element instanceof HTMLTextAreaElement) {
      const label = this.findFieldLabel(element);
      const inferredPurpose = this.inferFieldPurpose(element, label);

      return {
        id: element.id || `field-${index}`,
        name: element.name,
        type: 'textarea',
        label,
        placeholder: element.placeholder,
        required: element.required,
        value: element.value,
        minLength: element.minLength > 0 ? element.minLength : undefined,
        maxLength: element.maxLength > 0 ? element.maxLength : undefined,
        selector: this.generateFieldSelector(element, index),
        inferredPurpose,
      };
    }

    if (element instanceof HTMLSelectElement) {
      const label = this.findFieldLabel(element);
      const options = Array.from(element.options).map(opt => opt.value || opt.text);
      const inferredPurpose = this.inferFieldPurpose(element, label);

      return {
        id: element.id || `field-${index}`,
        name: element.name,
        type: 'select',
        label,
        required: element.required,
        value: element.value,
        options,
        selector: this.generateFieldSelector(element, index),
        inferredPurpose,
      };
    }

    return null;
  }

  /**
   * Map HTML input types to our types
   */
  private mapInputType(htmlType: string): FormFieldType {
    const mapping: Record<string, FormFieldType> = {
      text: 'text',
      email: 'email',
      password: 'password',
      tel: 'tel',
      number: 'number',
      date: 'date',
      time: 'time',
      'datetime-local': 'datetime-local',
      url: 'url',
      search: 'search',
      checkbox: 'checkbox',
      radio: 'radio',
      file: 'file',
      hidden: 'hidden',
      submit: 'submit',
      button: 'button',
    };

    return mapping[htmlType] || 'text';
  }

  /**
   * Find the label for a field
   */
  private findFieldLabel(element: HTMLElement): string {
    // Check for associated label
    const id = element.id;
    if (id) {
      const label = this.getDocument().querySelector(`label[for="${id}"]`);
      if (label) {
        return label.textContent?.trim() || '';
      }
    }

    // Check for wrapping label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.replace(element.textContent || '', '').trim() || '';
    }

    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // Use placeholder as fallback
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.placeholder || element.name || '';
    }

    return element.getAttribute('name') || '';
  }

  /**
   * Generate a reliable selector for a field
   */
  private generateFieldSelector(element: HTMLElement, index: number): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.getAttribute('name')) {
      const name = element.getAttribute('name');
      const tag = element.tagName.toLowerCase();
      return `${tag}[name="${name}"]`;
    }

    // Fall back to index-based selector
    const tag = element.tagName.toLowerCase();
    const form = element.closest('form');
    if (form) {
      return `form ${tag}:nth-of-type(${index + 1})`;
    }

    return `${tag}:nth-of-type(${index + 1})`;
  }

  /**
   * Infer the purpose of a field from its attributes
   */
  private inferFieldPurpose(element: HTMLElement, label: string): FieldPurpose {
    const searchables = [
      element.id,
      element.getAttribute('name'),
      element.getAttribute('autocomplete'),
      element.getAttribute('placeholder'),
      label,
    ].filter(Boolean).join(' ').toLowerCase();

    for (const [purpose, patterns] of Object.entries(FIELD_PURPOSE_PATTERNS)) {
      if (purpose === 'unknown') continue;

      for (const pattern of patterns) {
        if (pattern.test(searchables)) {
          return purpose as FieldPurpose;
        }
      }
    }

    // Check input type hints
    if (element instanceof HTMLInputElement) {
      if (element.type === 'email') return 'email';
      if (element.type === 'tel') return 'phone';
      if (element.type === 'password') return 'password';
      if (element.type === 'search') return 'search';
    }

    return 'unknown';
  }

  /**
   * Find the submit button in a form
   */
  private findSubmitButton(form: HTMLFormElement): { selector: string; text: string } | undefined {
    // Look for submit input
    const submitInput = form.querySelector('input[type="submit"]');
    if (submitInput instanceof HTMLInputElement) {
      return {
        selector: submitInput.id ? `#${submitInput.id}` : 'input[type="submit"]',
        text: submitInput.value || 'Submit',
      };
    }

    // Look for button with type submit
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      return {
        selector: submitButton.id ? `#${submitButton.id}` : 'button[type="submit"]',
        text: submitButton.textContent?.trim() || 'Submit',
      };
    }

    // Look for any button (often implicitly submit)
    const anyButton = form.querySelector('button');
    if (anyButton) {
      return {
        selector: anyButton.id ? `#${anyButton.id}` : 'button',
        text: anyButton.textContent?.trim() || 'Submit',
      };
    }

    return undefined;
  }

  /**
   * Determine the type of form
   */
  private determineFormType(form: HTMLFormElement, fields: FormField[]): FormType {
    // Check form attributes
    const searchables = [
      form.id,
      form.className,
      form.action,
      form.getAttribute('name'),
    ].filter(Boolean).join(' ');

    for (const [type, patterns] of Object.entries(FORM_TYPE_PATTERNS)) {
      if (type === 'unknown') continue;

      for (const pattern of patterns) {
        if (pattern.test(searchables)) {
          return type as FormType;
        }
      }
    }

    // Infer from fields
    const hasPassword = fields.some(f => f.type === 'password');
    const hasEmail = fields.some(f => f.type === 'email' || f.inferredPurpose === 'email');
    const hasConfirmPassword = fields.some(f => f.inferredPurpose === 'confirmPassword');
    const hasName = fields.some(f => ['firstName', 'lastName', 'fullName'].includes(f.inferredPurpose || ''));
    const hasSearch = fields.some(f => f.type === 'search' || f.inferredPurpose === 'search');
    const hasCreditCard = fields.some(f => f.inferredPurpose === 'creditCard');
    const hasAddress = fields.some(f =>
      ['address', 'addressLine1', 'city', 'state', 'zipCode'].includes(f.inferredPurpose || '')
    );

    if (hasPassword && hasConfirmPassword) return 'signup';
    if (hasPassword && hasEmail && fields.length <= 4) return 'login';
    if (hasCreditCard) return 'payment';
    if (hasAddress && !hasCreditCard) return 'shipping';
    if (hasSearch && fields.length === 1) return 'search';
    if (hasEmail && hasName && !hasPassword) return 'contact';
    if (hasEmail && fields.length === 1) return 'newsletter';

    return 'unknown';
  }

  /**
   * Detect standalone inputs that act like forms
   */
  private detectStandaloneInputs(container: Element): DetectedForm[] {
    const forms: DetectedForm[] = [];

    // Find search inputs not in forms
    const searchInputs = container.querySelectorAll('input[type="search"]:not(form input), input[role="searchbox"]:not(form input)');
    searchInputs.forEach((input, index) => {
      if (input instanceof HTMLInputElement) {
        forms.push({
          id: `standalone-search-${index}`,
          method: 'GET',
          fields: [{
            id: input.id || `search-${index}`,
            name: input.name,
            type: 'search',
            label: this.findFieldLabel(input),
            required: false,
            selector: this.generateFieldSelector(input, index),
            inferredPurpose: 'search',
          }],
          formType: 'search',
          selector: this.generateFieldSelector(input, index),
        });
      }
    });

    return forms;
  }

  /**
   * Fill a form with provided data
   */
  private async handleFillForm(payload: FillFormPayload): Promise<{ filled: boolean; filledFields: string[] }> {
    this.log('info', `Filling form: ${payload.formSelector}`);
    this.setProgress(10);

    const form = this.getElement(payload.formSelector);
    if (!form) {
      throw new Error(`Form not found: ${payload.formSelector}`);
    }

    const filledFields: string[] = [];
    const strategy = payload.strategy || 'smart';

    // First, detect the form structure
    const formAnalysis = this.analyzeForm(form as HTMLFormElement, 0);
    this.setProgress(30);

    // Map data to fields
    const fieldMappings = this.mapDataToFields(formAnalysis.fields, payload.data, strategy);
    this.setProgress(50);

    // Fill each field
    let progress = 50;
    const progressIncrement = 40 / Object.keys(fieldMappings).length;

    for (const [fieldSelector, value] of Object.entries(fieldMappings)) {
      try {
        await this.fillField(fieldSelector, value);
        filledFields.push(fieldSelector);
        this.log('info', `Filled field: ${fieldSelector}`);
      } catch (error) {
        this.log('warn', `Failed to fill field ${fieldSelector}: ${error instanceof Error ? error.message : String(error)}`);
      }

      progress += progressIncrement;
      this.setProgress(Math.min(90, progress));
    }

    this.setProgress(100);
    this.log('info', `Filled ${filledFields.length} fields`);

    return { filled: filledFields.length > 0, filledFields };
  }

  /**
   * Map data keys to form fields
   */
  private mapDataToFields(
    fields: FormField[],
    data: Record<string, string | boolean>,
    strategy: 'exact' | 'smart' | 'ai'
  ): Record<string, string | boolean> {
    const mappings: Record<string, string | boolean> = {};

    if (strategy === 'exact') {
      // Match by exact field name or id
      for (const field of fields) {
        if (data[field.name] !== undefined) {
          mappings[field.selector] = data[field.name];
        } else if (data[field.id] !== undefined) {
          mappings[field.selector] = data[field.id];
        }
      }
    } else {
      // Smart matching using inferred purposes
      for (const field of fields) {
        // Try direct match first
        if (data[field.name] !== undefined) {
          mappings[field.selector] = data[field.name];
          continue;
        }

        if (data[field.id] !== undefined) {
          mappings[field.selector] = data[field.id];
          continue;
        }

        // Try purpose-based matching
        if (field.inferredPurpose && field.inferredPurpose !== 'unknown') {
          if (data[field.inferredPurpose] !== undefined) {
            mappings[field.selector] = data[field.inferredPurpose];
            continue;
          }

          // Try common aliases
          const aliases = this.getFieldAliases(field.inferredPurpose);
          for (const alias of aliases) {
            if (data[alias] !== undefined) {
              mappings[field.selector] = data[alias];
              break;
            }
          }
        }
      }
    }

    return mappings;
  }

  /**
   * Get common aliases for field purposes
   */
  private getFieldAliases(purpose: FieldPurpose): string[] {
    const aliases: Record<FieldPurpose, string[]> = {
      firstName: ['first_name', 'firstname', 'fname', 'givenName', 'given_name'],
      lastName: ['last_name', 'lastname', 'lname', 'familyName', 'family_name', 'surname'],
      fullName: ['name', 'full_name', 'fullname'],
      email: ['email_address', 'emailAddress', 'mail'],
      phone: ['telephone', 'tel', 'mobile', 'cell', 'phoneNumber', 'phone_number'],
      address: ['street', 'streetAddress', 'street_address'],
      addressLine1: ['address1', 'street1', 'line1'],
      addressLine2: ['address2', 'street2', 'line2', 'apt', 'suite'],
      city: ['town', 'locality'],
      state: ['province', 'region'],
      zipCode: ['zip', 'postal', 'postalCode', 'postal_code', 'postcode'],
      country: ['nation'],
      company: ['organization', 'business', 'companyName', 'company_name'],
      jobTitle: ['title', 'position', 'role'],
      username: ['user', 'login', 'userId', 'user_id'],
      password: ['pass', 'pwd'],
      confirmPassword: ['password2', 'passwordConfirm', 'password_confirm'],
      creditCard: ['card', 'cardNumber', 'card_number', 'ccNumber'],
      cvv: ['cvc', 'securityCode', 'security_code'],
      expiryDate: ['expiry', 'expDate', 'exp_date'],
      birthDate: ['dob', 'birthday', 'dateOfBirth', 'date_of_birth'],
      message: ['body', 'content', 'comment', 'text'],
      subject: ['title', 'topic'],
      quantity: ['qty', 'amount', 'count'],
      search: ['query', 'q', 'keyword', 'keywords'],
      unknown: [],
    };

    return aliases[purpose] || [];
  }

  /**
   * Fill a single field
   */
  private async fillField(selector: string, value: string | boolean): Promise<void> {
    const element = this.getElement(selector);
    if (!element) {
      throw new Error(`Field not found: ${selector}`);
    }

    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = Boolean(value);
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        element.value = String(value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = String(value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element instanceof HTMLSelectElement) {
      element.value = String(value);
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Submit a form
   */
  private async handleSubmitForm(payload: SubmitFormPayload): Promise<{ submitted: boolean }> {
    this.log('info', `Submitting form: ${payload.formSelector}`);
    this.setProgress(10);

    const form = this.getElement(payload.formSelector);
    if (!form || !(form instanceof HTMLFormElement)) {
      throw new Error(`Form not found: ${payload.formSelector}`);
    }

    this.setProgress(50);

    // Dispatch submit event
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const defaultPrevented = !form.dispatchEvent(submitEvent);

    if (!defaultPrevented) {
      // Native form submission
      form.submit();
    }

    this.setProgress(100);
    this.log('info', 'Form submitted');

    return { submitted: true };
  }

  /**
   * Validate a form
   */
  private async handleValidateForm(payload: ValidateFormPayload): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
  }> {
    this.log('info', `Validating form: ${payload.formSelector}`);
    this.setProgress(10);

    const form = this.getElement(payload.formSelector);
    if (!form || !(form instanceof HTMLFormElement)) {
      throw new Error(`Form not found: ${payload.formSelector}`);
    }

    this.setProgress(50);

    const errors: Array<{ field: string; message: string }> = [];

    // Check HTML5 validation
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      if (input instanceof HTMLInputElement ||
          input instanceof HTMLTextAreaElement ||
          input instanceof HTMLSelectElement) {
        if (!input.checkValidity()) {
          errors.push({
            field: input.name || input.id || 'unknown',
            message: input.validationMessage,
          });
        }
      }
    });

    this.setProgress(100);
    this.log('info', `Form validation: ${errors.length === 0 ? 'valid' : `${errors.length} errors`}`);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  protected onTerminate(): void {
    this.iframeRef = null;
    this.log('info', 'FormAgent terminated');
  }
}

// Factory function
function createFormAgent(config?: Partial<AgentConfig>): FormAgent {
  return new FormAgent(config);
}

// Register the agent type
AgentRegistry.register(FORM_AGENT_METADATA, createFormAgent);

export { FORM_AGENT_METADATA };
