import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function TeddyBear() {
  return (
    <CategoryGridPage
      title="Teddy Bear"
      description="Cuddly companions to complete your gift."
      heroImg="/images/backdrop.jpg"
      query={{ collection: "Teddy Bear" }}
    />
  );
}
