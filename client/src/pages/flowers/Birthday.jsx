// src/pages/Birthday.jsx
import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Birthday() {
  return (
    <CategoryGridPage
      title="Birthday Flowers"
      description="Make their day extra special with hand-picked blooms. Same-day delivery across Dubai."
      heroImg="/assets/Birthday/hero.jpg"
      category="Birthday"
      altFilters={[{ key: "occasion", value: "Birthday" }]}
    />
  );
}
