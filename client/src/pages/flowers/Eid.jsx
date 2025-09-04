import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Eid() {
  return (
    <CategoryGridPage
      title="Eid Flowers"
      description="Celebrate Eid with our exquisite flower arrangements."
      heroImg="/images/eid-hero.jpeg"
      category="Eid"
      altFilters={[
        { key: "category", value: "Eid" },
        { key: "occasion", value: "Eid" },
      ]}
    />
  );
}
