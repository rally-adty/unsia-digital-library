// Error dengan status HTTP, supaya controller cukup melempar dan
// error handler global yang menentukan bentuk respons JSON-nya.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Token tidak valid atau sudah kedaluwarsa') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Anda tidak memiliki hak akses untuk aksi ini') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Data tidak ditemukan') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Data sudah ada') {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
