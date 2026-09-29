// Next.js declares `*.module.css` but not plain `*.css`. A side-effect
// import like `import "./globals.css"` normally still type-checks, because
// TypeScript doesn't check side-effect imports by default — but editors (and
// `tsc --noUncheckedSideEffectImports`) do check them, and report the import
// as an unresolved module. Declaring the module here satisfies both.
declare module "*.css";
