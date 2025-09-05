import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Summer() {
  return (
    <CategoryGridPage
      title="Summer Collection"
      description="Bright, sun-kissed blooms and airy textures—perfect for warm days in Dubai."
      heroImg="/assets/Collections/Summer/hero.jpg"
      category="Summer Collection"
      altFilters={[
        { key: "collection", value: "Summer" },
        { key: "collection", value: "Summer Collection" },
        { key: "season", value: "Summer" },
        { key: "category", value: "Summer" },
        { key: "tag", value: "Summer" },
      ]}
    />
  );
}
