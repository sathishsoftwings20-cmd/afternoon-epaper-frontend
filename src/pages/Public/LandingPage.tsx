// src/pages/Public/LandingPage.tsx
import PageMeta from "../../components/common/PageMeta";
import PublicLandingPage from "../../components/public/LandingPage"; // Make sure this import is correct

export default function LandingPage() {
  return (
    <>
      <PageMeta
        title="Latest News in Coimbatore, Chennai and across Tamil Nadu"
        description="Afternoon news offers comprehensive news and updates from across Coimbatore, Chennai and Tamil Nadu."
      />
      <PublicLandingPage />
    </>
  );
}
