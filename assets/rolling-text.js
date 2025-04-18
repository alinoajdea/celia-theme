document.addEventListener("DOMContentLoaded", function () {
  // Select all rolling-text-wrapper elements
  const rollingTextWrappers = document.querySelectorAll(".rolling-text-wrapper");

  rollingTextWrappers.forEach(wrapper => {
    const rollingTextContent = wrapper.querySelector(".rolling-text-content");

    if (rollingTextContent) {
      // Duplicate text content to create a seamless loop
      const contentText = rollingTextContent.innerHTML;
      rollingTextContent.innerHTML = contentText + " " + contentText + " " + contentText;

      // Apply scroll speed from settings
      const scrollSpeed = wrapper.getAttribute("data-scroll-speed") || 10;
      rollingTextContent.style.animationDuration = `${scrollSpeed}s`;
    }
  });
});
