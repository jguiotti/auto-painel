import { PageContainer } from "@autopainel/shared/ui";

interface StorefrontPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** Consistent max-width and horizontal padding across storefront pages. */
export function StorefrontPageContainer({
  children,
  className,
}: StorefrontPageContainerProps) {
  return (
    <PageContainer size="xl" className={className}>
      {children}
    </PageContainer>
  );
}
