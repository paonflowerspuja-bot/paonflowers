import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Lemonium() {
  return (
    <CategoryGridPage
      title="Lemonium"
      description="Delicate Lemonium for texture and contrast."
      heroImg="/images/backdrop.jpg"
      query={{ type: "Lemonium" }}
    />
  );
}
