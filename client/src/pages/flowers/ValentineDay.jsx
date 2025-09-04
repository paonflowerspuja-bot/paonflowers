import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Valentine() {
  return (
    <CategoryGridPage
      title="Valentine's Day Flowers"
      description="Romantic bouquets and luxe boxes to say it from the heart. Same-day Dubai."
      heroImg="/images/valentineday-hero.jpg"
      category="Valentine Day"
      altFilters={[
        { key: "category", value: "Valentine" },
        { key: "occasion", value: "Valentine Day" },
        { key: "occasion", value: "Valentine's Day" },
      ]}
    />
  );
}
