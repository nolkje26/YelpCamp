//error handling helper - make sure there's a next for all your async callbacks
module.exports = function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e))
    }
}
