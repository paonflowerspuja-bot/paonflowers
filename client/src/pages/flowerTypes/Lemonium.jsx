import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Lemonium() {
  return (
    <CategoryGridPage
      title="Limonium (Statice)"
      description="Ethereal fillers that add texture, color, and lasting charm."
      heroImg="/assets/Types/Limonium/hero.jpg"
      category="Lemonium"
      altFilters={[
        { key: "type", value: "Lemonium" },
        { key: "type", value: "Limonium" }, // correct spelling fallback
        { key: "category", value: "Limonium" },
        { key: "category", value: "Statice" },
      ]}
    />
  );
}
