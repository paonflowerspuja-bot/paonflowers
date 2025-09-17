import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Foliage() {
  return (
    <CategoryGridPage
      title="Foliage"
      description="Lush greens to complement any bouquet."
      heroImg="/images/backdrop.jpg"
      query={{ type: "Foliage" }}
    />
  );
}
