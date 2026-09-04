/** Primary admin-suite routes that use standalone admin chrome. */
export function isAdminChromePath(pathname: string) {
  return (
    pathname === "/app/admin" ||
    pathname.startsWith("/app/admin/") ||
    pathname === "/app/discussions" ||
    pathname.startsWith("/app/discussions/") ||
    pathname === "/app/reports" ||
    pathname.startsWith("/app/reports/")
  );
}
