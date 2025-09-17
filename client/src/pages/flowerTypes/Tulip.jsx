import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Tulip() {
  return (
    <CategoryGridPage
      title="Tulips"
      description="Fresh, cheerful tulips to lift the day."
      heroImg="/images/backdrop.jpg"
      query={{ type: "Tulip" }}
    />
  );
}
