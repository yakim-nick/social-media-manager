export function compose(middlewares) {
  return (req, res, done) => {
    let index = 0;

    function next(err) {
      if (err) {
        const errorMw = middlewares.slice(index).find((m) => m.length === 4);
        if (errorMw) {
          errorMw(err, req, res, next);
        } else if (done) {
          done(err);
        }
        return;
      }

      const mw = middlewares[index++];
      if (!mw) {
        if (done) done();
        return;
      }

      if (mw.length === 4) {
        next();
        return;
      }

      try {
        mw(req, res, next);
      } catch (caughtErr) {
        next(caughtErr);
      }
    }

    next();
  };
}
