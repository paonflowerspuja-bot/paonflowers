import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Balloons() {
  return (
    <CategoryGridPage
      title="Balloons"
      description="Make it pop—foil, latex, and custom balloon add-ons for any bouquet."
      heroImg="/assets/Collections/Balloons/hero.jpg"
      category="Balloons"
      altFilters={[
        { key: "collection", value: "Balloons" },
        { key: "collection", value: "Balloon" },
        { key: "category", value: "Balloons" },
        { key: "tag", value: "Balloons" },
        { key: "addon", value: "Balloons" },
        { key: "addOn", value: "Balloons" },
        { key: "type", value: "Balloons" },
      ]}
    />
  );
}
