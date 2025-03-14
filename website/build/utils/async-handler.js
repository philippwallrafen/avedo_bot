// ~/website/src/utils/async-handler.ts
export function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve()
        .then(() => handler(req, res, next))
        .catch(next);
}
