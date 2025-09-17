import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Red() {
  return (
    <CategoryGridPage
      title="Red Flowers"
      description="Classic reds for passion, celebration, and timeless style."
      heroImg="/images/backdrop.jpg"
      query={{ color: "Red" }}
    />
  );
}
