import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Rose() {
  return (
    <CategoryGridPage
      title="Roses"
      description="Timeless roses for every heartfelt message."
      heroImg="/images/backdrop.jpg"
      query={{ type: "Rose" }}
    />
  );
}
