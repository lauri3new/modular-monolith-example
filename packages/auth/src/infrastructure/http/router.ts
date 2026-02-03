/**
 * Auth HTTP Router
 *
 * ARCHITECTURAL DECISION:
 * The router is a factory function that receives dependencies explicitly.
 * This avoids global service locators and makes dependencies visible.
 *
 * The router is the infrastructure adapter between HTTP and application layer.
 * It handles:
 * - Request parsing and validation
 * - Error mapping to HTTP status codes
 * - Response formatting
 */

import { Router, type Request, type Response, type NextFunction } from "express";

import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case.js";
import { LoginUserUseCase } from "../../application/use-cases/login-user.use-case.js";
import type { RegisterUserDto, LoginDto } from "../../application/dtos.js";
import {
  AuthError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidPasswordError,
} from "../../application/errors.js";
import type { UserCredentialsRepository } from "../../domain/repositories/user-credentials.repository.js";
import type { EventBus } from "@acme/shared";

export interface AuthRouterDependencies {
  userCredentialsRepository: UserCredentialsRepository;
  eventBus: EventBus;
  jwtSecret: string;
  jwtExpiresIn: number;
}

/**
 * Factory function to create the auth router with explicit dependencies.
 */
export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const router = Router();

  const registerUserUseCase = new RegisterUserUseCase({
    userCredentialsRepository: deps.userCredentialsRepository,
    eventBus: deps.eventBus,
  });

  const loginUserUseCase = new LoginUserUseCase({
    userCredentialsRepository: deps.userCredentialsRepository,
    eventBus: deps.eventBus,
    jwtSecret: deps.jwtSecret,
    jwtExpiresIn: deps.jwtExpiresIn,
  });

  /**
   * POST /auth/register
   * Register a new user
   */
  router.post(
    "/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dto: RegisterUserDto = {
          email: req.body.email,
          password: req.body.password,
        };

        const user = await registerUserUseCase.execute(dto);

        res.status(201).json({
          success: true,
          data: user,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /auth/login
   * Authenticate user and return token
   */
  router.post(
    "/login",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dto: LoginDto = {
          email: req.body.email,
          password: req.body.password,
        };

        const token = await loginUserUseCase.execute(dto);

        res.status(200).json({
          success: true,
          data: token,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Auth-specific error handler
  router.use(authErrorHandler);

  return router;
}

/**
 * Maps auth domain errors to HTTP responses.
 */
function authErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof EmailAlreadyExistsError) {
    res.status(409).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof InvalidCredentialsError) {
    res.status(401).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (
    error instanceof InvalidEmailError ||
    error instanceof InvalidPasswordError
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof AuthError) {
    res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  // Pass unknown errors to global handler
  next(error);
}
