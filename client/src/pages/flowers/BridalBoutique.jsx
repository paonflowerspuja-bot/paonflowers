import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function BridalBoutique() {
  return (
    <CategoryGridPage
      title="Bridal Boutique"
      description="Refined florals for wedding elegance."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "Bridal Boutique" }}
    />
  );
}
