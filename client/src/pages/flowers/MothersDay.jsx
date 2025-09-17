import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function MothersDay() {
  return (
    <CategoryGridPage
      title="Mother's Day"
      description="Thank her with elegant, heartfelt blooms."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "Mother's Day" }}
    />
  );
}
