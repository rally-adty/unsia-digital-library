// Membungkus controller async agar error-nya diteruskan ke error handler
// global tanpa perlu try/catch di setiap fungsi.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
