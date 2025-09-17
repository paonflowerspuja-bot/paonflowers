import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Yellow() {
  return (
    <CategoryGridPage
      title="Yellow Flowers"
      description="Bright yellows to spark smiles and sunshine vibes."
      heroImg="/images/backdrop.jpg"
      query={{ color: "Yellow" }}
    />
  );
}
