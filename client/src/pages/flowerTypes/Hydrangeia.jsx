import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Hydrangeia() {
  return (
    <CategoryGridPage
      title="Hydrangeia"
      description="Full-bloom Hydrangeia stems in vibrant palettes."
      heroImg="/images/backdrop.jpg"
      query={{ type: "Hydrangeia" }}
    />
  );
}
