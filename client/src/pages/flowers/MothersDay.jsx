import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function MothersDay() {
  return (
    <CategoryGridPage
      title="Mother's Day Flowers"
      description="Show love and gratitude with elegant bouquets and luxury boxes."
      heroImg="/assets/MothersDay/hero.jpg"
      category="Mother's Day"
      altFilters={[
        { key: "category", value: "Mothers Day" }, // no apostrophe fallback
        { key: "occasion", value: "Mother's Day" },
        { key: "occasion", value: "Mothers Day" },
      ]}
    />
  );
}
