import { Request, Response, NextFunction } from "express";

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
      if (!ErrorHandler.instance) {
          ErrorHandler.instance = new ErrorHandler();
      }
      return ErrorHandler.instance;
  }

  public handle = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
      success: false,
      message,
      errors: err.errors || [],
      stack: err.stack 
    });
  };
}

export const errorHandlerInstance = ErrorHandler.getInstance();
export default errorHandlerInstance.handle;
