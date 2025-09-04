import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function NewBaby() {
  return (
    <CategoryGridPage
      title="New Baby Flowers"
      description="Soft pastels and gentle hues to welcome the little one. Same-day Dubai."
      heroImg="/assets/NewBaby/hero.jpg"
      category="New Baby"
      altFilters={[
        { key: "category", value: "Baby" },
        { key: "occasion", value: "New Baby" },
      ]}
    />
  );
}
