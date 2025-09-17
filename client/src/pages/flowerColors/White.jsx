import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function White() {
  return (
    <CategoryGridPage
      title="White Flowers"
      description="Elegant whites for serenity, grace, and pure moments."
      heroImg="/images/backdrop.jpg"
      query={{ color: "White" }}
    />
  );
}
