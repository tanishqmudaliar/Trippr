export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Setup page has its own layout without sidebar
  return <>{children}</>;
}
