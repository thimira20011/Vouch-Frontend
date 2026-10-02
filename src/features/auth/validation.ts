import type { AccountValues, CampusValues, FormErrors, SignInValues } from './types';

export const PASSWORD_HINT = '8–128 characters, with uppercase, lowercase and a number.';

export function validateSignIn(values: SignInValues): FormErrors {
  const errors: FormErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.Email.trim())) errors.Email = 'Enter a valid email address.';
  if (!values.Password) errors.Password = 'Enter your password.';
  return errors;
}

export function validateAccount(values: AccountValues): FormErrors {
  const errors = validateSignIn(values);
  if (!values.FullName.trim()) errors.FullName = 'Enter your full name.';
  const domain = values.Email.trim().toLowerCase().split('@')[1];
  const approvedDomains = (import.meta.env.VITE_APPROVED_UNIVERSITY_DOMAINS ?? '').split(',').map((item: string) => item.trim().toLowerCase()).filter(Boolean);
  if (!errors.Email && !domain?.endsWith('.ac.lk') && !approvedDomains.includes(domain)) {
    errors.Email = 'Use your .ac.lk or approved university email.';
  }
  // This format check does not verify email ownership or campus eligibility.
  if (values.Password && (values.Password.length < 8 || values.Password.length > 128 ||
    !/[A-Z]/.test(values.Password) || !/[a-z]/.test(values.Password) || !/[0-9]/.test(values.Password))) {
    errors.Password = 'Use 8–128 characters, including uppercase, lowercase and a number.';
  }
  return errors;
}

export function validateCampus(values: CampusValues, invitation: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!values.CampusCode) errors.CampusCode = 'Choose your university.';
  if (!values.Faculty) errors.Faculty = 'Choose your faculty.';
  if (!values.Department) errors.Department = 'Choose your department.';
  if (!/^[1-7]$/.test(String(values.AcademicYear))) errors.AcademicYear = 'Choose an academic year from 1 to 7.';
  if (invitation && !values.InviteToken.trim()) errors.InviteToken = 'Enter your ambassador invitation code.';
  return errors;
}
