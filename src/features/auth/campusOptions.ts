// Illustrative options for reviewing the form. Replace with the backend campus catalogue.
export const campusOptions = [
  { value: 'SAB', label: 'Sabaragamuwa', fullName: 'Sabaragamuwa University of Sri Lanka' },
];
export const facultyOptions = [{ value: 'Applied Sciences', label: 'Applied Sciences' }];
export const departmentOptions = [
  { value: 'Computing and Information Systems', label: 'Computing and Information Systems' },
  { value: 'Physical Sciences', label: 'Physical Sciences' },
];
export const yearOptions = Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: `Year ${i + 1}` }));
