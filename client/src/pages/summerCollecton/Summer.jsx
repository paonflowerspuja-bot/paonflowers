import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Summer() {
  return (
    <CategoryGridPage
      title="Summer Collection"
      description="Seasonal highlights, bright and beautiful."
      heroImg="/images/backdrop.jpg"
      query={{ collection: "Summer Collection" }}
    />
  );
}
