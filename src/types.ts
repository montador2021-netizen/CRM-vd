export interface User {
  id: string;
  firstName: string;
  lastName: string;
  store: string;
  password: string;
  role: 'vendedor' | 'admin';
}
