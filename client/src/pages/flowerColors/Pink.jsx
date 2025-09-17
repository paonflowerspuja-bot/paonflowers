import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Pink() {
  return (
    <CategoryGridPage
      title="Pink Flowers"
      description="Soft pinks for warmth, joy, and everyday gifting."
      heroImg="/images/backdrop.jpg"
      query={{ color: "Pink" }}
    />
  );
}
