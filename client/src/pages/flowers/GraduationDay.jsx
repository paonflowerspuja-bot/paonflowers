import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function GraduationDay() {
  return (
    <CategoryGridPage
      title="Graduation Day"
      description="Celebrate new beginnings with fresh florals."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "Graduation Day" }}
    />
  );
}
