import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";
export default function White() {
  return (
    <CategoryGridPage
      title="White Flowers"
      description="Pure, elegant whites—perfect for minimal, luxe aesthetics."
      heroImg="/assets/Colors/White/hero.jpg"
      category="White"
      altFilters={[
        { key: "color", value: "White" },
        { key: "colour", value: "White" },
        { key: "colors", value: "White" },
        { key: "tag", value: "White" },
      ]}
    />
  );
}
