import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Eid() {
  return (
    <CategoryGridPage
      title="Eid Flowers"
      description="Festive selections for joyful gatherings."
      heroImg="/images/backdrop.jpg"
      query={{ occasion: "Eid" }}
    />
  );
}
