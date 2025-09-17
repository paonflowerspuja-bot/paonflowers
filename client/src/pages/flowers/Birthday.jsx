import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Birthday() {
  return (
    <CategoryGridPage
      title="Birthday Flowers"
      description="Make their day bright with birthday blooms."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "Birthday" }}
    />
  );
}
