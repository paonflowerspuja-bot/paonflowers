import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function GraduationDay() {
  return (
    <CategoryGridPage
      title="Graduation Day Flowers"
      description="Celebrate their milestone with fresh, uplifting blooms—delivered across Dubai."
      heroImg="/assets/GraduationDay/hero.jpg"
      category="Graduation Day"
      altFilters={[
        { key: "category", value: "Graduation" },
        { key: "occasion", value: "Graduation Day" },
      ]}
    />
  );
}
