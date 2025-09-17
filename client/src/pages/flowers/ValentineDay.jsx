import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function ValentineDay() {
  return (
    <CategoryGridPage
      title="Valentine Day"
      description="Say it with flowers—bold, red, and romantic."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "Valentine Day" }}
    />
  );
}
