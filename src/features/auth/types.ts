export type AccountValues = { FullName: string; Email: string; Password: string };
export type SignInValues = Pick<AccountValues, 'Email' | 'Password'>;
export type CampusValues = { CampusCode: string; Faculty: string; Department: string; AcademicYear: string; InviteToken: string };
export type FieldName = keyof AccountValues | keyof CampusValues;
export type FormErrors = Partial<Record<FieldName, string>>;
export type AuthRoute = 'sign-in' | 'sign-up' | 'campus' | 'invitation';
export type SelectOption = { value: string; label: string };
