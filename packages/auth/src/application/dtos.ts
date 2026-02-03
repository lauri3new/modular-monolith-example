/**
 * Data Transfer Objects for Auth domain
 *
 * ARCHITECTURAL DECISION:
 * DTOs are the contract for data crossing boundaries.
 * They are simple objects without behavior, used for:
 * - HTTP request/response bodies
 * - Inter-domain communication
 * - External API contracts
 */

export interface RegisterUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokenDto {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthUserDto {
  id: string;
  email: string;
  isVerified: boolean;
}
