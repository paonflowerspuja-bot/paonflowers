import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";
export default function Pink() {
  return (
    <CategoryGridPage
      title="Pink Flowers"
      description="Soft blush to bold fuchsia—romantic pinks for every occasion."
      heroImg="/assets/Colors/Pink/hero.jpg"
      category="Pink"
      altFilters={[
        { key: "color", value: "Pink" },
        { key: "colour", value: "Pink" },
        { key: "colors", value: "Pink" },
        { key: "tag", value: "Pink" },
      ]}
    />
  );
}
