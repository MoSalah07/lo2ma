// A Node resolve hook for running the app's TypeScript from scripts: the app imports its own files without an
// extension ('./dishes'), as the bundler allows, and Node needs one. Registered by scripts that import app code.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !relative || /\.[cm]?[jt]sx?$/.test(specifier)) {
      throw error;
    }
    return next(`${specifier}.ts`, context);
  }
}
