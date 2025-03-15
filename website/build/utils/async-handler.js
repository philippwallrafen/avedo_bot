// ~/website/src/utils/async-handler.ts
export function asyncHandler(handler) {
  return (req, res, next) =>
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMtaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9hc3luYy1oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVDQUF1QztBQUl2QyxNQUFNLFVBQVUsWUFBWSxDQUMxQixPQUEyRDtJQUUzRCxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUN4QixPQUFPLENBQUMsT0FBTyxFQUFFO1NBQ2QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQixDQUFDIn0=
