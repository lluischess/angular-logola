// Interfaces para la autenticación con el backend NestJS

export interface LoginRequest {
  email: string; // Nombre de usuario (lluisadmin, jordiadmin, etc.)
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenValidationResponse {
  user: User;
  token: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
  error?: string;
}
