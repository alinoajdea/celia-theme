document.addEventListener("DOMContentLoaded", () => {
  console.log("Mega menu script loaded");
  const menuItems = document.querySelectorAll(".mega-menu__item");
  const imageContainer = document.getElementById("MegaMenuImage");
  let hoverTimeout; // Store timeout reference

  // Function to update the image only if it's different
  const updateImage = (imageSrc, altText) => {
    if (!imageSrc || imageSrc.trim() === "" || imageSrc.includes("no-image")) {
      return; // Prevent setting the default "no image" placeholder
    }

    if (imageContainer.src !== imageSrc) {
      imageContainer.style.opacity = "0"; // Start fade-out effect
      setTimeout(() => {
        imageContainer.src = imageSrc;
        imageContainer.alt = altText || "Collection Image";
        imageContainer.style.display = "block"; // Ensure image is visible
        imageContainer.style.opacity = "1"; // Fade-in effect
      }, 150); // Small delay for smooth transition
    }
  };

  // Get the first valid collection image for the current menu
  const getFirstValidImage = () => {
    for (let item of menuItems) {
      const imageSrc = item.getAttribute("data-collection-image");
      const altText = item.querySelector("a")?.textContent.trim();
      if (imageSrc && imageSrc.trim() !== "" && !imageSrc.includes("no-image")) {
        return { imageSrc, altText };
      }
    }
    return null;
  };

  // Prevent showing "no image" placeholders by setting a valid default image
  const firstValidImage = getFirstValidImage();
  if (firstValidImage) {
    imageContainer.style.display = "block";
    imageContainer.src = firstValidImage.imageSrc;
    imageContainer.alt = firstValidImage.altText;
  } else {
    imageContainer.style.display = "none";
  }

  // Add hover events with delay to prevent flickering
  menuItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimeout); // Cancel any previous timeout
      hoverTimeout = setTimeout(() => {
        const imageSrc = item.getAttribute("data-collection-image");
        const altText = item.querySelector("a")?.textContent.trim();
        if (imageSrc && imageSrc.trim() !== "" && !imageSrc.includes("no-image")) {
          updateImage(imageSrc, altText);
        }
      }, 250); // 150ms delay before changing image
    });

    item.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimeout); // Cancel timeout if user moves away quickly
      hoverTimeout = setTimeout(() => {
        if (firstValidImage && imageContainer.src !== firstValidImage.imageSrc) {
          updateImage(firstValidImage.imageSrc, firstValidImage.altText);
        }
      }, 200); // Small delay before switching back to default image
    });
  });
});
