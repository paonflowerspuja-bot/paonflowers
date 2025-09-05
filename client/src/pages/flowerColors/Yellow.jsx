import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";
export default function Yellow() {
  return (
    <CategoryGridPage
      title="Yellow Flowers"
      description="Sunny, joyful blooms that brighten any space."
      heroImg="/assets/Colors/Yellow/hero.jpg"
      category="Yellow"
      altFilters={[
        { key: "color", value: "Yellow" },
        { key: "colour", value: "Yellow" },
        { key: "colors", value: "Yellow" },
        { key: "tag", value: "Yellow" },
      ]}
    />
  );
}
