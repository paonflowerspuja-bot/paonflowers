import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";
export default function Red() {
  return (
    <CategoryGridPage
      title="Red Flowers"
      description="Classic reds for passion, celebration, and timeless style."
      heroImg="/assets/Colors/Red/hero.jpg"
      category="Red"
      altFilters={[
        { key: "color", value: "Red" },
        { key: "colour", value: "Red" },
        { key: "colors", value: "Red" },
        { key: "tag", value: "Red" },
      ]}
    />
  );
}
