import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function NewBaby() {
  return (
    <CategoryGridPage
      title="New Baby"
      description="Welcome little ones with gentle hues."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "New Baby" }}
    />
  );
}
