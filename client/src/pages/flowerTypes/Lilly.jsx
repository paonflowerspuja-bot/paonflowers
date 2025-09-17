import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Lilly() {
  return (
    <CategoryGridPage
      title="Lilly"
      description="Graceful lilies (Lilly) with classic charm."
      heroImg="/images/backdrop.jpg"
      query={{ type: "Lilly" }}
    />
  );
}
