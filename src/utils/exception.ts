export class CustomError extends Error {
  name: string;
  status_code: number;
  status: string;
  constructor(
    message: string,
    status_code?: number,
    status?: string,
    name?: string,
  ) {
    super(message);
    this.name = name || "CustomError";
    this.status_code = status_code || 500;
    this.status = status || "error";
  }
}

export function handleExceptionGlobal(error: CustomError) {
  console.log(error);
}
