import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Balloons() {
  return (
    <CategoryGridPage
      title="Balloons"
      description="Pair your flowers with cheerful balloons."
      heroImg="/images/backdrop.jpg"
      query={{ collection: "Balloons" }}
    />
  );
}
